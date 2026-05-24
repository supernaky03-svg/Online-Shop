from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Post, Review
from app.schemas import PaginatedPosts, PostDetailOut, PostListOut, ReviewCreate, ReviewOut

router = APIRouter(tags=["public"])


@router.get("/healthz")
async def healthz() -> dict[str, bool]:
    return {"ok": True}


@router.get("/posts", response_model=PaginatedPosts)
async def list_posts(
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> PaginatedPosts:
    filters = []
    if search and search.strip():
        filters.append(Post.name.ilike(f"%{search.strip()}%"))

    total_query = select(func.count(Post.id))
    post_query = (
        select(Post)
        .options(selectinload(Post.images), selectinload(Post.contacts))
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if filters:
        total_query = total_query.where(*filters)
        post_query = post_query.where(*filters)

    total = int(await db.scalar(total_query) or 0)
    posts = list((await db.scalars(post_query)).unique().all())

    review_counts_result = await db.execute(
        select(Review.post_id, func.count(Review.id)).where(Review.post_id.in_([p.id for p in posts] or [0])).group_by(Review.post_id)
    )
    review_counts = {post_id: count for post_id, count in review_counts_result.all()}

    items = []
    for post in posts:
        item = PostListOut.model_validate(post)
        item.review_count = int(review_counts.get(post.id, 0))
        items.append(item)
    return PaginatedPosts(items=items, total=total, limit=limit, offset=offset)


@router.get("/posts/{post_id}", response_model=PostDetailOut)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)) -> PostDetailOut:
    post = await db.scalar(
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.images), selectinload(Post.contacts), selectinload(Post.reviews))
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post.reviews.sort(key=lambda review: review.created_at, reverse=True)
    detail = PostDetailOut.model_validate(post)
    detail.review_count = len(post.reviews)
    return detail


@router.get("/posts/{post_id}/reviews", response_model=list[ReviewOut])
async def list_reviews(post_id: int, db: AsyncSession = Depends(get_db)) -> list[ReviewOut]:
    exists = await db.scalar(select(Post.id).where(Post.id == post_id))
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    reviews = list(
        (await db.scalars(select(Review).where(Review.post_id == post_id).order_by(Review.created_at.desc()))).all()
    )
    return [ReviewOut.model_validate(review) for review in reviews]


@router.post("/posts/{post_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(post_id: int, payload: ReviewCreate, db: AsyncSession = Depends(get_db)) -> ReviewOut:
    exists = await db.scalar(select(Post.id).where(Post.id == post_id))
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    review = Review(post_id=post_id, gmail=str(payload.gmail), review_text=payload.review_text.strip())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewOut.model_validate(review)

# Manual Testing Checklist

## Backend

- [ ] `GET /health` returns `{ "ok": true }`.
- [ ] Backend starts with Render command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Tables are created in Neon after first backend startup.
- [ ] Wrong admin password returns `401`.
- [ ] Correct admin password sets admin session cookie.
- [ ] Protected admin routes fail when not logged in.
- [ ] Protected admin routes work after login.
- [ ] `POST /admin/logout` clears the admin session.

## Admin website

- [ ] Admin can log in with password.
- [ ] Admin cannot log in with wrong password.
- [ ] Add Post button opens form.
- [ ] Add post validation requires product name.
- [ ] Add post validation requires price greater than 0.
- [ ] Add post validation requires at least 1 image.
- [ ] Add post validation blocks more than 5 images.
- [ ] Image previews show before submit.
- [ ] Selected new images can be removed before submit.
- [ ] Buy Contact + button adds another contact box.
- [ ] Contact boxes can be removed.
- [ ] Invalid contact links show validation errors.
- [ ] Valid Facebook/TikTok/Telegram/Viber links are accepted.
- [ ] Published post appears in admin post list.
- [ ] Admin post list shows first image, name, price, instock, created date, edit, delete, and manage reviews.
- [ ] Edit post shows existing images.
- [ ] Edit post can remove old images.
- [ ] Edit post can add new images.
- [ ] Edit post still enforces total 1-5 images.
- [ ] Edit post can update contacts.
- [ ] Delete post asks confirmation.
- [ ] Delete post removes the post from admin list.
- [ ] Review management opens reviews for a post.
- [ ] Admin can delete any review.
- [ ] Toast notifications appear after create/update/delete/review delete.

## Client website

- [ ] Homepage loads published posts.
- [ ] Empty state appears when no posts exist.
- [ ] Mobile homepage shows compact 2-column post cards.
- [ ] Each card shows first image, name, price, optional instock, and caption preview.
- [ ] Search icon and search field are visible.
- [ ] Search filters posts by product name.
- [ ] Clicking a card opens product detail page.
- [ ] Product detail shows image carousel when multiple images exist.
- [ ] Product detail shows normal image when only one image exists.
- [ ] Full caption preserves multiline text.
- [ ] Buy contact section shows only icons for contact types added by admin.
- [ ] Contact icon opens external link in new tab safely.
- [ ] Review form validates email format.
- [ ] Review form rejects empty review text.
- [ ] Submitted review appears publicly.
- [ ] Empty reviews state appears before reviews exist.
- [ ] Review created date appears.

## Deployment

- [ ] Backend Render env vars are set.
- [ ] Client/admin `VITE_API_BASE_URL` points to deployed backend URL.
- [ ] Backend `CORS_ORIGINS` includes deployed client and admin URLs.
- [ ] Cloudinary uploads work after Render deploy.
- [ ] Neon database stores posts/images/contacts/reviews.
- [ ] UptimeRobot monitor pings `/health` every 5 minutes.

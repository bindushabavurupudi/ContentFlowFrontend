export const POSTS_UPDATED_EVENT = "posts:updated";

export const notifyPostsUpdated = () => {
  window.dispatchEvent(new Event(POSTS_UPDATED_EVENT));
};

export const subscribePostsUpdated = (handler: () => void) => {
  window.addEventListener(POSTS_UPDATED_EVENT, handler);
  return () => window.removeEventListener(POSTS_UPDATED_EVENT, handler);
};

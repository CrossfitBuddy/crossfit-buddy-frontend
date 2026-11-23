export const isMediaUrl = (url: string) => /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)

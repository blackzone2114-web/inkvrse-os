const OUTPUT_STREAM_EVENT = "link:output-stream";

export function publishLinkOutputStream(stream: MediaStream) {
  window.dispatchEvent(new CustomEvent<MediaStream>(OUTPUT_STREAM_EVENT, { detail: stream }));
}

export function subscribeToLinkOutputStream(handler: (stream: MediaStream) => void) {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<MediaStream>;
    if (custom.detail) handler(custom.detail);
  };
  window.addEventListener(OUTPUT_STREAM_EVENT, listener);
  return () => window.removeEventListener(OUTPUT_STREAM_EVENT, listener);
}

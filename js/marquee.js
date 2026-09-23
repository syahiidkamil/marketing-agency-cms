// Duplicate each marquee track's items so the -50% translate loops seamlessly.
document.querySelectorAll('.marquee-track').forEach((track) => {
  [...track.children].forEach((item) => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });
});

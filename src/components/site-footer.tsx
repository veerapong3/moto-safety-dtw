export function SiteFooter() {
  return (
    <footer className="border-t border-slate-700 bg-slate-800 py-4 text-center text-xs text-slate-400">
      <p>
        © {new Date().getFullYear()} ระบบสารสนเทศความปลอดภัยรถจักรยานยนต์นักเรียน.
        งานความปลอดภัยในสถานศึกษา โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร.
      </p>
    </footer>
  );
}

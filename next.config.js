// the local blog admin shows the site in an iframe; nobody else may frame it
const FRAME_ANCESTORS = "frame-ancestors 'self' http://127.0.0.1:4317 http://localhost:4317";

module.exports = {
  async rewrites() {
    // nicer URL for the resume, which the admin can replace (see pages/api/resume.js)
    return [{ source: '/resume', destination: '/api/resume' }];
  },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: FRAME_ANCESTORS }] }];
  }
};

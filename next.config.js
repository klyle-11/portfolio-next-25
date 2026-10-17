module.exports = {
  async rewrites() {
    // nicer URL for the resume, which the admin can replace (see pages/api/resume.js)
    return [{ source: '/resume', destination: '/api/resume' }];
  }
};

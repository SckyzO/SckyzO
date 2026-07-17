'use strict';

// Static deploy artifacts (robots.txt, .htaccess) generated alongside the CV.
// Kept as pure string builders so they can be unit-tested without launching a
// full Chromium build.

// Extensions of downloadable files that must be hidden from search engines.
const NON_INDEXABLE_EXTENSIONS = ['pdf', 'md', 'txt'];

function generateRobotsTxt() {
  const disallow = NON_INDEXABLE_EXTENSIONS.flatMap((ext) => [
    `Disallow: /*.${ext}$`,
    `Disallow: /*.${ext.toUpperCase()}$`
  ]);
  return ['User-agent: *', ...disallow].join('\n');
}

function generateHtaccess() {
  const extensions = NON_INDEXABLE_EXTENSIONS.join('|');
  return [
    'RewriteEngine On',
    'RewriteCond %{HTTPS} off',
    'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    '',
    '<IfModule mod_headers.c>',
    // The dot must be escaped once for Apache's PCRE engine: "\.(pdf|md|txt)$".
    `  <FilesMatch "\\.(${extensions})$">`,
    '    Header set X-Robots-Tag "noindex, nofollow"',
    '  </FilesMatch>',
    '</IfModule>'
  ].join('\n');
}

module.exports = { generateRobotsTxt, generateHtaccess, NON_INDEXABLE_EXTENSIONS };

import { renderToString } from 'react-dom/server';
// react-router 7 exports StaticRouter from the root package; the v6
// 'react-router-dom/server' subpath no longer exists.
import { StaticRouter } from 'react-router';
import { AppRoutes } from './App.jsx';

// React 19 hoists <title>, <meta> and <link> to the front of this string.
// scripts/prerender.js splits them off and moves them into <head>.
export default function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}

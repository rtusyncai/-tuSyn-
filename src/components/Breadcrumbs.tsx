import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { routes } from '../routes';
import { cn } from '../lib/utils';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are on home page, don't show breadcrumbs
  if (pathnames.length === 0) return null;

  // Find if current route should hide breadcrumbs
  const currentRoute = routes.find(r => r.path === location.pathname);
  if (currentRoute?.hideBreadcrumbs) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40">
        <li className="flex items-center gap-2">
          <Link 
            to="/" 
            className="hover:text-[#5A5A40] transition-colors flex items-center gap-1"
          >
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="opacity-40" />
        </li>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Improved route matching
          const matchedRoute = routes.find(route => {
            const routeParts = route.path.split('/').filter(x => x);
            // Match if paths are same length (direct match or dynamic match)
            if (routeParts.length === pathnames.slice(0, index + 1).length) {
              return routeParts.every((part, i) => part.startsWith(':') || part === pathnames[i]);
            }
            return false;
          });

          // If this segment is part of a longer dynamic route that we haven't reached the end of,
          // and it's not a real route itself, we might want to skip it or give it a better name.
          // BUT simpler: if it's an ID (looks like one), and we have a matchedRoute, use its name.
          
          let name = value.charAt(0).toUpperCase() + value.slice(1);
          if (matchedRoute) {
            name = matchedRoute.name;
          } else if (value.length > 20 || /^[0-9a-fA-F-]+$/.test(value)) {
            // Looks like an ID but we didn't match a route for this exact slice
            // Just call it "Details" or similar
            name = "Details";
          }

          // Skip showing intermediate segments that are just "product" or similar if they don't have a route
          if (!matchedRoute && (value === 'product' || value === 'view' || value === 'detail')) {
             return null;
          }

          return (
            <li key={to} className="flex items-center gap-2">
              {last ? (
                <span className="text-[#5A5A40] font-black truncate max-w-[200px]">
                  {name}
                </span>
              ) : (
                <>
                  <Link 
                    to={to} 
                    className="hover:text-[#5A5A40] transition-colors"
                  >
                    {name}
                  </Link>
                  <ChevronRight size={12} className="opacity-40" />
                </>
              )}
            </li>
          );
        }).filter(Boolean)}
      </ol>
    </nav>
  );
};

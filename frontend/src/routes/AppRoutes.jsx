import { Routes, Route } from 'react-router-dom';
import HomePage from '../HomePage';

// Feature routes (leads, customers, deals, activities, notifications,
// dashboard, auth) are added in later phases.
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;

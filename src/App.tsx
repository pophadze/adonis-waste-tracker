import React from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import HomePage from './pages/HomePage';
import cn from 'classnames';
import Closing from './pages/Closing';
import History from './pages/History';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/complete" element={<Closing />} />
        <Route path="/history" element={<History />} />
      </Routes>

      <footer className='footer'>
        <div className='logout-block'>
          <NavLink
            to="/"
            className={({isActive}) => (cn('navigation__link', {
              'navigation__link--active': isActive,
            }))}
          >
            <DeleteIcon />Списання
          </NavLink>
          <NavLink
            to="/complete"
            className={({isActive}) => (cn('navigation__link', {
              'navigation__link--active': isActive,
            }))}
          >
            <DeleteForeverIcon />Закриття
          </NavLink>
        </div>
        <span className='logout-email'>
          ua-00010.store@ua.mcd.com
        </span>
      </footer>
    </HashRouter >
  );
}


export default App;

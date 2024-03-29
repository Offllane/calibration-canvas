import './header.component.css';
import {Link} from 'react-router-dom';

export function HeaderComponent() {
  return (
    <header>
      <nav className="menu">
        <Link
          to='/'
          className='menu__link'
        >
          Points
        </Link>
        <Link
          to='/canvas-polygon'
          className='menu__link'
        >
          Polygon
        </Link>
        <Link
          to='/canvas-select'
          className='menu__link'
        >
          Selection
        </Link>
      </nav>
    </header>
  );
}
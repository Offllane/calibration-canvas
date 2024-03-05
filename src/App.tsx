import React from 'react';
import './App.css';
import {Route, Routes} from 'react-router-dom'
import {CanvasPointsPage} from './pages/canvasPointsPage/canvasPoints.page';
import {CanvasPolygonPage} from './pages/canvasPolygonPage/canvasPolygon.page';
import {CanvasSelectPage} from './pages/canvasSelectPage/canvasSelect.page';
import {HeaderComponent} from './features/header/header.component';

function App() {
  return (
    <>
      <HeaderComponent/>
        <Routes>
          <Route
            path="/"
            element={<CanvasPointsPage/>}
          />
          <Route
            path="/canvas-polygon"
            element={<CanvasPolygonPage/>}
          />
          <Route
            path="/canvas-select"
            element={<CanvasSelectPage/>}
          />
        </Routes>
    </>
  );
}

export default App;

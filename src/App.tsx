import React from 'react';
import './App.css';
import {Route, Routes} from 'react-router-dom'
import {CanvasPointsPage} from './pages/canvasPointsPage/canvasPoints.page';
import {CanvasPolygonPage} from './pages/canvasPolygonPage/canvasPolygon.page';
import {CanvasSelectPage} from './pages/canvasSelectPage/canvasSelect.page';
import {HeaderComponent} from './features/header/header.component';
import {LinePolygonPage} from "./pages/linePolygonPage/linePolygon.page";
import {LinesPolygonPage} from "./pages/linesPolygonPage/linesPolygon.page";

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
          <Route
            path="/line-polygon"
            element={<LinePolygonPage/>}
          />
          <Route
            path="/lines-polygon"
            element={<LinesPolygonPage/>}
          />
        </Routes>
    </>
  );
}

export default App;

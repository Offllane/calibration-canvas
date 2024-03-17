import './minimap.css';
import {useEffect, useRef, useState} from 'react';
import {Core} from 'cytoscape';
import {Size} from '../../types/types';

interface MinimapProps {
  cy: Core,
  imageSrc: string | null;
  imageWidth: number;
}

export function Minimap({
  cy,
  imageSrc,
  imageWidth,
}: MinimapProps) {
  const minimapImage = useRef(null);
  const [selectionWidth, setSelectionWidth] = useState<number>(0);
  const [selectionHeight, setSelectionHeight] = useState<number>(0);
  const [selectionLeftPosition, setSelectionLeftPosition] = useState<number>(0);
  const [selectionTopPosition, setSelectionTopPosition] = useState<number>(0);
  const [scale, setScale] = useState(0);

  const addEventListeners = () => {
    if (!cy || !scale) { return; }

    cy.on('viewport', () => {
      const canvasSize: Size = { width: cy.container()!.offsetWidth, height: cy.container()!.offsetHeight };
      const imageLeftPosition = Math.abs(cy.pan().x / cy.zoom());
      const imageTopPosition = Math.abs(cy.pan().y / cy.zoom());
      const selectionLeftPosition = imageLeftPosition * scale;
      const selectionTopPosition = imageTopPosition * scale;
      const selectionWidth = canvasSize.width / cy.zoom() * scale;
      const selectionHeight = canvasSize.height / cy.zoom() * scale;

      setSelectionWidth(selectionWidth);
      setSelectionHeight(selectionHeight);
      setSelectionLeftPosition(selectionLeftPosition);
      setSelectionTopPosition(selectionTopPosition);
    });
  }

  useEffect(() => {
    if (!imageSrc) { return; }

    const minimapImageElement: HTMLElement = minimapImage.current as unknown as HTMLElement;
    setScale(minimapImageElement.offsetWidth / imageWidth);
    addEventListeners();

    return () => {
      cy.off('viewport');
    };
  }, [cy, imageSrc, scale]);

  return (
    <div
      className='minimap-wrapper'
    >
      {imageSrc &&
        <>
          <img
            src={imageSrc}
            alt="minimap"
            ref={minimapImage}
          />
          <div
            className="selection"
            style={{
              width: selectionWidth,
              height: selectionHeight,
              left: selectionLeftPosition,
              top: selectionTopPosition
            }}
          ></div>
        </>
      }
    </div>
  );
}
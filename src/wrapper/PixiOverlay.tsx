import "leaflet-pixi-overlay";

import L, { LeafletPixiOverlayDefnition } from "leaflet";
import * as PIXI from "pixi.js";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

export interface PixiOverlayMarker {
  id: string | number;
  iconId: string;
  position: L.LatLng;
  popup?: string;
  popupOpen: boolean;
  tooltip?: string;
  tooltipOptions?: L.TooltipOptions;
  markerSpriteAnchor?: [number, number];
  angle?: number;
}

export interface PopupData {
  id: string | number;
  offset: [number, number];
  position: L.LatLng;
  content?: string;
  popupOptions?: L.PopupOptions;
}

export interface TooltipData {
  id: string | number;
  offset: [number, number];
  position: L.LatLng;
  content?: string;
  tooltipOptions?: L.TooltipOptions;
}

export interface PixiOverlayProps {
  markers: PixiOverlayMarker[];
  onMarkerClick?: (markerId: string | number) => void;
}

export default function PixiOverlay({
  markers,
  onMarkerClick,
}: PixiOverlayProps) {
  const [pixiOverlay, setPixiOverlay] = useState<
    LeafletPixiOverlayDefnition | undefined
  >(undefined);
  const [loaded, setLoaded] = useState(false);
  const [openedTooltipData, setOpenedTooltipData] = useState<
    TooltipData | undefined
  >(undefined);
  const [openedPopupData, setOpenedPopupData] = useState<PopupData | undefined>(
    undefined,
  );

  const [openedTooltip, setOpenedTooltip] = useState<L.Tooltip | undefined>(
    undefined,
  );
  const [openedPopup, setOpenedPopup] = useState<L.Popup | undefined>(
    undefined,
  );

  const map = useMap();

  useEffect(() => {
    // this useEffect is done to load the initial assets to pixi
    if (loaded) return;
    (async () => {
      await PIXI.Assets.load([
        {
          src: "/bluebird-arrow.png",
          alias: "bluebird-arrow",
        },
      ]);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // create a new pixi container whenever the map changes
    const pixiContainer = new PIXI.Container();
    const overlay = L.pixiOverlay((utils) => {
      const scale = utils.getScale();
      const container = utils.getContainer();
      container.children.forEach((child) => child.scale.set(1 / (scale ?? 1)));
      utils.getRenderer().render(container);
    }, pixiContainer);
    // add pixi overlay to map
    overlay.addTo(map);
    setPixiOverlay(overlay);

    setOpenedTooltipData(undefined);
    setOpenedPopupData(undefined);

    return () => {
      pixiContainer.removeChildren();
    };
  }, [map]);

  useEffect(() => {
    const cleanup = () => {
      pixiOverlay && pixiOverlay.utils.getContainer().removeChildren();
    };

    if (!pixiOverlay) return cleanup;
    if (!markers) return cleanup;
    if (!loaded) return cleanup;

    const utils = pixiOverlay.utils;
    const container = utils.getContainer();
    const renderer = utils.getRenderer();
    const project = utils.latLngToLayerPoint;
    const scale = utils.getScale();

    for (const marker of markers) {
      const markerSprite = PIXI.Sprite.from(marker.iconId);
      if (marker.markerSpriteAnchor) {
        markerSprite.anchor.set(
          marker.markerSpriteAnchor[0],
          marker.markerSpriteAnchor[1],
        );
      } else {
        markerSprite.anchor.set(0.5, 1);
      }

      const markerCoords = project(marker.position);
      markerSprite.x = markerCoords.x;
      markerSprite.y = markerCoords.y;

      if (marker.angle) {
        markerSprite.angle = marker.angle;
      }

      markerSprite.scale.set(1 / (scale ?? 1));

      if (marker.popupOpen) {
        setOpenedPopupData({
          id: marker.id,
          offset: [0, -15],
          position: marker.position,
          content: marker.popup,
        });
      }

      if (marker.popup || marker.tooltip) {
        markerSprite.eventMode = "dynamic";
      }

      if (marker.popup && onMarkerClick) {
        markerSprite.on("mousedown", () => {
          let moveCount = 0;
          markerSprite.on("mousemove", () => {
            moveCount++;
          });
          markerSprite.on("mouseup", () => {
            if (moveCount < 2) {
              onMarkerClick(marker.id);
            }
          });
        });

        markerSprite.on("touchstart", () => {
          let moveCount = 0;
          markerSprite.on("touchmove", () => {
            moveCount++;
          });
          markerSprite.on("touchend", () => {
            if (moveCount < 10) {
              onMarkerClick(marker.id);
            }
          });
        });
      }

      if (marker.tooltip) {
        markerSprite.on("mouseover", () => {
          setOpenedTooltipData({
            id: marker.id,
            offset: [0, -25],
            position: marker.position,
            content: marker.tooltip,
            tooltipOptions: marker.tooltipOptions ?? {},
          });
        });

        markerSprite.on("mouseout", () => {
          setOpenedTooltipData(undefined);
        });
      }

      container.addChild(markerSprite);
    }

    renderer.render(container);

    return cleanup;
  }, [pixiOverlay, markers, loaded, onMarkerClick]);

  useEffect(() => {
    if (openedTooltip) {
      map.removeLayer(openedTooltip);
    }
    if (
      openedTooltipData &&
      (!openedPopup ||
        !openedPopupData ||
        openedPopupData.id !== openedTooltipData.id)
    ) {
      setOpenedTooltip(openTooltip(map, openedTooltipData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, openedPopupData, openedTooltipData]);

  useEffect(() => {
    if (openedPopup) {
      map.removeLayer(openedPopup);
    }
    if (openedPopupData) {
      setOpenedPopup(openPopup(map, openedPopupData, { autoClose: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedPopupData, map]);

  if (map.getZoom() === undefined) {
    console.error(
      "no zoom found, add zoom prop to map to avoid getContainer error",
    );
    return undefined;
  }

  return undefined;
}

function openPopup(map: L.Map, data: PopupData, extraOptions: L.PopupOptions) {
  return L.popup({ offset: data.offset, ...extraOptions })
    .setLatLng(data.position)
    .setContent(data.content ?? "")
    .addTo(map);
}

function openTooltip(map: L.Map, data: TooltipData) {
  return L.tooltip({ offset: data.offset, ...data.tooltipOptions })
    .setLatLng(data.position)
    .setContent(data.content ?? "")
    .addTo(map);
}

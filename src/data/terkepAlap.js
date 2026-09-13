/* Ahol a térkép indul, ha nincs megosztott útvonal.

   Saját modul, mert nem csak a térképnek kell: a tervező is ebből tudja,
   hova kérdezze a hőmérsékletet, még MIELŐTT a Leaflet betöltődne. A
   térkép komponense külön darabban érkezik (lásd TerkepKesobb.jsx), és ha
   ezért a fejléc foka is megvárná, másodpercekkel később jelenne meg. */

export const KEZDO_KOZEP = [47.4979, 19.0402];   // Budapest
export const KEZDO_ZOOM = 12;

import { useMemo, VFC } from 'react';
import { Appearance, CutieMark, CutieMarkFacing } from 'src/types';
import { CutieMarkColorMapping, getColorMapping } from 'src/utils';
import { uniqueId } from 'lodash';

interface CMPreviewPaths {
  tail: string;
  bodyOutline: string;
  bodyFill: string;
  bodyShadowFill: string;
}

const DEFAULT_COLOR_MAPPING: CutieMarkColorMapping = {
  'Coat Outline': '#0d0d0d',
  'Coat Shadow Outline': '#000',
  'Coat Fill': '#2b2b2b',
  'Coat Shadow Fill': '#171717',
  'Mane & Tail Outline': '#333',
  'Mane & Tail Fill': '#5e5e5e',
};

/* eslint-disable max-len */
const CM_PREVIEW_PATHS: Record<Exclude<CutieMarkFacing, null>, CMPreviewPaths> = {
  left: {
    tail: 'M96.1,21.6 C106.3,0.6,137.3-23,166.1-27c20.5-2.9,52.4,63.8,52.4,63.8s-73.5-24-99-0.4',
    bodyShadowFill:
      'M41.2,151.2 c4.5,5.4,8.2,10.6,10,16c8.7,25.7,13.9,76.6-3.1,129.5c-15,46.6-30,50.8,11.8,50.4c31.3-0.3,40.8-1.1,44.2-14.8 c22.6-91,4.4-155.4-1.9-169.4c-3.1-6.9-8.6-6.2-8.6-6.2',
    bodyFill:
      'M-23.6,41.9c12.5,3.7,30.8,4.6,54-6.8c45.8-22.5,71.9-24.6,97.8,6.3 c24.6,29.3,14.4,75.9,2.7,107.1c0,0-0.9,7.5-1.9,17.6c0,0,15.7-2,19.6,4.8c7.7,13.5,47.7,60.3,43,173.1c-0.6,14.7-10.1,19-41.5,19 c-45,0-31.8,6.3-30.8-49.5c1.5-79.1-24.5-112.5-40-138.4l-17.9-22.9c-22.8,19.9-73.9,18.4-104.5,9.3',
    bodyOutline:
      'M136.1,181.4c-1.5-0.8-2.8-1.9-3.9-3.1c-0.6-0.6-1.1-1.3-1.6-2c-0.4-0.7-1-1.4-1.3-2.2 c-1.6-3.1-2.6-6.5-2.8-10c-0.1-1.7-0.1-3.5,0-5.2c0.1-1.7,0.4-3.4,0.7-5.1c0.4-1.7,0.9-3.3,1.4-4.9l1.5-4.6 c3.9-12.2,6.8-24.7,8.4-37.3c0.8-6.3,1.3-12.7,1.2-19c-0.1-6.3-0.6-12.6-1.9-18.7c-1.2-6.1-3.3-12-6.2-17.4l-1.2-2l-0.6-1 l-0.6-0.9l-1.3-1.9l-1.4-1.8c-0.2-0.3-0.5-0.6-0.7-0.9l-0.8-0.9l-1.6-1.8c-1.1-1.1-2.1-2.3-3.2-3.4c-2.2-2.2-4.5-4.3-7-6.1 c-2.4-1.9-5-3.5-7.7-4.9c-2.7-1.4-5.5-2.5-8.5-3.3c-2.9-0.8-5.9-1.3-9-1.4c-6.1-0.4-12.3,0.4-18.4,1.8c-6.1,1.4-12.1,3.5-18.1,5.8 c-5.9,2.4-11.8,5-17.6,7.8l-2.2,1l-2.3,1.1l-2.2,1l-2.3,1c-0.8,0.3-1.6,0.7-2.3,0.9l-2.4,0.8c-1.6,0.6-3.2,1-4.8,1.5 c-6.4,1.9-13.1,3-19.9,3.2c-6.8,0.2-13.6-0.6-20.1-2.6l0,0l3.8-2.4L-40.1,162l-2.1-3.4c8.6,2.4,17.6,3.9,26.6,4.8 c2.2,0.2,4.5,0.4,6.8,0.6c2.3,0.1,4.5,0.2,6.8,0.3c2.3,0.1,4.5,0.1,6.8,0.1c2.3,0,4.5-0.1,6.8-0.2c1.1,0,2.3-0.1,3.4-0.2 c1.1-0.1,2.2-0.2,3.4-0.3c2.2-0.2,4.5-0.5,6.7-0.8c4.4-0.6,8.8-1.5,13.1-2.6c2.1-0.6,4.3-1.2,6.4-2c2.1-0.7,4.1-1.6,6.1-2.5 c1-0.5,2-0.9,2.9-1.5c0.5-0.3,1-0.5,1.4-0.8l1.4-0.9c1.8-1.1,3.5-2.4,5.2-3.8l3.9,4.5c-1.9,1.6-3.9,3.1-5.9,4.3l-1.6,1 c-0.5,0.3-1.1,0.6-1.6,0.9c-1.1,0.6-2.1,1.1-3.2,1.6c-2.2,1-4.4,1.9-6.6,2.7c-2.2,0.8-4.5,1.5-6.8,2.1c-4.6,1.2-9.2,2.1-13.9,2.8 c-2.3,0.3-4.7,0.6-7,0.8c-1.2,0.1-2.3,0.2-3.5,0.3c-1.2,0.1-2.3,0.2-3.5,0.2c-2.3,0.1-4.7,0.2-7,0.2c-2.3,0-4.7,0-7-0.1 c-2.3-0.1-4.7-0.2-7-0.3c-2.3-0.2-4.7-0.3-7-0.6c-9.3-0.9-18.5-2.5-27.6-5l-2.6-0.7l0.4-2.6l19.4-119.7l0.5-3.3l3.3,0.9l0,0 c5.9,1.7,12.1,2.5,18.3,2.3c6.2-0.2,12.4-1.2,18.4-3c1.5-0.5,3-0.9,4.5-1.4l2.2-0.8c0.7-0.3,1.4-0.6,2.2-0.9l2.1-0.9l2.2-1l2.1-1 l2.2-1.1c5.9-2.8,11.9-5.5,18-8c6.1-2.4,12.4-4.5,18.9-6c6.5-1.5,13.3-2.4,20.1-1.9c3.4,0.2,6.8,0.7,10.2,1.6 c3.3,0.9,6.6,2.2,9.6,3.7c3.1,1.6,6,3.4,8.6,5.5c2.7,2.1,5.2,4.3,7.6,6.7c1.2,1.2,2.3,2.4,3.5,3.7l1.6,1.8l0.8,0.9 c0.3,0.4,0.5,0.7,0.8,1l1.6,2l1.4,2.1l0.7,1.1l0.6,1.1l1.3,2.2c3.2,6,5.4,12.5,6.8,19.1c1.4,6.6,1.9,13.3,2,19.9 c0.1,6.6-0.4,13.2-1.2,19.8c-1.7,13.1-4.7,25.9-8.7,38.4l-1.5,4.7l-0.6,2.2c-0.2,0.7-0.5,1.5-0.6,2.2c-0.8,2.9-1.4,5.9-1.6,8.9 c-0.1,3,0,6,0.8,9c0.1,0.8,0.4,1.5,0.6,2.2c0.3,0.7,0.5,1.5,0.9,2.2C134.3,178.8,135.1,180.2,136.1,181.4z M128.6,162.4c0,0,0.2,0,0.5-0.1c0.3,0,0.7-0.1,1.3-0.1c1.1-0.1,2.8-0.2,5.1-0.1c2.2,0.1,5,0.3,8.3,1.5 c1.7,0.6,3.5,1.5,5.2,3.1c0.2,0.2,0.4,0.4,0.6,0.6l0.3,0.4l0.2,0.3c0.3,0.3,0.6,0.7,0.8,1.1c0.6,0.8,1.2,1.5,1.8,2.3 c4.7,6.4,9.7,14.5,14.5,24.3c4.8,9.8,9.5,21.1,13.5,33.9c4,12.7,7.3,26.9,9.6,42c1.1,7.6,2.1,15.3,2.7,23.3c0.2,2,0.3,4,0.4,6 c0.1,2,0.3,4.1,0.3,6.1c0.1,4.1,0.3,8.2,0.3,12.4c0.1,8.3-0.1,16.7-0.5,25.4c-0.2,2.3-0.6,4.7-1.4,7.1c-0.9,2.4-2.3,4.7-4.2,6.5 c-1.9,1.8-4.1,3.1-6.4,4c-2.2,0.9-4.5,1.5-6.7,2c-4.5,0.9-9,1.3-13.4,1.6c-4.4,0.2-8.9,0.3-13.3,0.3c-4.4,0-8.8,0-13.3-0.1 c-2.2-0.1-4.5-0.2-6.7-0.3c-2.3-0.2-4.6-0.4-7-1c-1.2-0.3-2.5-0.7-3.8-1.5c-1.3-0.7-2.7-1.9-3.5-3.4c-0.9-1.5-1.2-3-1.3-4.4 c-0.1-1.4-0.1-2.6,0-3.8c0.2-2.4,0.5-4.6,0.9-6.8c0.3-2.2,0.7-4.3,1-6.5c1.3-8.6,1.9-17.1,1.9-25.6c0-17.3-1.3-34.1-4.1-50.2 c-1.4-8-3.2-15.8-5.4-23.4c-2.2-7.5-4.7-14.8-7.6-21.6c-5.7-13.8-12.8-26-19.7-37.2c-1.7-2.8-3.4-5.7-5.1-8 c-1.8-2.5-3.7-4.9-5.5-7.2c-1.9-2.3-3.8-4.6-5.6-6.8c-1.8-2.2-3.6-4.4-5.2-6.6c-3.2-4.4-6.1-8.6-8.5-12.7 c-2.4-4.1-4.2-8.1-5.6-11.8c-1.4-3.7-2.2-7.2-2.7-10.2c-0.5-3-0.6-5.6-0.8-7.7c0-2.1,0-3.7,0.1-4.8c0.1-1.1,0.1-1.6,0.1-1.6 s0.1,0.5,0.2,1.6c0.1,1.1,0.4,2.6,0.8,4.6c0.8,4,2.4,9.8,5.7,16.6c3.3,6.8,8.3,14.4,15.2,22.5c1.7,2,3.5,4.1,5.3,6.3 c1.8,2.2,3.7,4.5,5.6,6.8c1.9,2.4,3.9,4.8,5.8,7.5c2,2.8,3.6,5.5,5.3,8.3c7,11.2,14.3,23.9,20.2,38.1c3,7.1,5.6,14.5,7.8,22.3 c2.2,7.7,4.1,15.8,5.5,24c2.9,16.4,4.2,33.8,4.2,51.2c0,8.9-0.7,17.7-2,26.5c-0.6,4.4-1.5,8.8-1.8,12.8c-0.2,2,0,3.9,0.5,4.7 c0.3,0.4,0.6,0.8,1.2,1.1c0.6,0.3,1.4,0.6,2.4,0.9c1.8,0.5,3.9,0.7,6,0.9c2.1,0.2,4.3,0.3,6.4,0.3c4.3,0.1,8.7,0.1,13.1,0.1 c4.4,0,8.7,0,13-0.3c4.3-0.2,8.5-0.6,12.5-1.4c4-0.8,7.8-2.2,10.2-4.5c1.2-1.2,2.1-2.5,2.7-4.2c0.6-1.6,0.9-3.5,1.1-5.4 c0.4-8.3,0.7-16.7,0.5-24.9c0-4.1-0.2-8.2-0.3-12.2c-0.1-2-0.2-4-0.3-6c-0.1-2-0.2-4-0.4-5.9c-0.6-7.9-1.6-15.5-2.7-22.9 c-2.3-14.8-5.5-28.6-9.4-41.1c-3.9-12.5-8.5-23.6-13.1-33c-4.7-9.5-9.5-17.3-14-23.4c-0.6-0.8-1.1-1.5-1.6-2.1 c-0.3-0.4-0.6-0.7-0.8-1.1l-0.2-0.3l-0.1-0.1c-0.1-0.1-0.2-0.2-0.3-0.3c-0.8-0.8-1.9-1.3-3.1-1.8c-2.3-0.8-4.7-1-6.6-1.1 c-1.9-0.1-3.4,0-4.4,0.1c-0.5,0-0.9,0.1-1.1,0.1c-0.2,0-0.3,0-0.3,0L128.6,162.4z',
  },
  right: {
    tail: 'M79.3,21.6 C69.1,0.6,38.2-23,9.4-27C-11.1-29.9-43,36.8-43,36.8s73.5-24,99-0.4',
    bodyShadowFill:
      'M134.3,151.2 c-4.5,5.4-8.2,10.6-10,16c-8.7,25.7-13.9,76.6,3.1,129.5c15,46.6,30,50.8-11.8,50.4c-31.3-0.3-40.8-1.1-44.2-14.8 c-22.6-91-4.4-155.4,1.9-169.4c3.1-6.9,8.6-6.2,8.6-6.2',
    bodyFill:
      'M199.1,41.9c-12.5,3.7-30.8,4.6-54-6.8c-45.8-22.5-71.9-24.6-97.8,6.3 c-24.6,29.3-14.4,75.9-2.7,107.1c0,0,0.9,7.5,1.9,17.6c0,0-15.7-2-19.6,4.8c-7.7,13.5-47.7,60.3-43,173.1c0.6,14.7,10.1,19,41.5,19 c45,0,31.8,6.3,30.8-49.5c-1.5-79.1,24.5-112.5,40-138.4l17.9-22.9c22.8,19.9,73.9,18.4,104.5,9.3',
    bodyOutline:
      'M39.3,181.4c1-1.3,1.8-2.7,2.5-4.1c0.3-0.7,0.6-1.5,0.9-2.2c0.2-0.8,0.5-1.5,0.6-2.2c0.7-3,0.9-6,0.8-9 c-0.2-3-0.7-6-1.6-8.9c-0.1-0.7-0.4-1.5-0.6-2.2l-0.6-2.2l-1.5-4.7c-4-12.5-7-25.3-8.7-38.4c-0.8-6.5-1.3-13.1-1.2-19.8 c0.1-6.6,0.6-13.3,2-19.9c1.3-6.6,3.6-13.1,6.8-19.1l1.3-2.2l0.6-1.1l0.7-1.1l1.4-2.1l1.6-2c0.3-0.3,0.5-0.7,0.8-1l0.8-0.9 l1.6-1.8c1.2-1.2,2.3-2.5,3.5-3.7c2.4-2.4,4.9-4.6,7.6-6.7c2.7-2.1,5.6-3.9,8.6-5.5c3.1-1.6,6.3-2.8,9.6-3.7 c3.3-0.9,6.8-1.4,10.2-1.6c6.9-0.5,13.6,0.4,20.1,1.9c6.5,1.5,12.8,3.7,18.9,6c6.1,2.4,12.1,5.1,18,8l2.2,1.1l2.1,1l2.2,1l2.1,0.9 c0.7,0.3,1.4,0.6,2.2,0.9l2.2,0.8c1.5,0.6,3,1,4.5,1.4c6,1.8,12.2,2.8,18.4,3c6.2,0.1,12.4-0.6,18.3-2.3l0,0l3.3-0.9l0.5,3.3 l19.4,119.7l0.4,2.6l-2.6,0.7c-9.1,2.5-18.3,4.1-27.6,5c-2.3,0.2-4.6,0.4-7,0.6c-2.3,0.1-4.7,0.3-7,0.3c-2.3,0.1-4.7,0.1-7,0.1 c-2.3,0-4.7-0.1-7-0.2c-1.2,0-2.3-0.1-3.5-0.2c-1.2-0.1-2.3-0.2-3.5-0.3c-2.3-0.2-4.7-0.5-7-0.8c-4.6-0.7-9.3-1.6-13.9-2.8 c-2.3-0.6-4.6-1.3-6.8-2.1c-2.2-0.8-4.5-1.7-6.6-2.7c-1.1-0.5-2.2-1-3.2-1.6c-0.5-0.3-1.1-0.6-1.6-0.9l-1.6-1 c-2.1-1.3-4-2.8-5.9-4.3l3.9-4.5c1.6,1.4,3.3,2.7,5.2,3.8l1.4,0.9c0.5,0.3,1,0.5,1.4,0.8c0.9,0.5,1.9,1,2.9,1.5 c2,0.9,4,1.7,6.1,2.5c2.1,0.7,4.2,1.4,6.4,2c4.3,1.2,8.7,2,13.1,2.6c2.2,0.3,4.5,0.6,6.7,0.8c1.1,0.1,2.2,0.2,3.4,0.3 c1.1,0.1,2.2,0.2,3.4,0.2c2.3,0.1,4.5,0.2,6.8,0.2c2.3,0,4.5,0,6.8-0.1c2.3-0.1,4.5-0.2,6.8-0.3c2.3-0.2,4.5-0.3,6.8-0.6 c9-0.9,17.9-2.4,26.6-4.8l-2.1,3.4L196.1,42.4l3.8,2.4l0,0c-6.5,1.9-13.4,2.7-20.1,2.6c-6.8-0.2-13.5-1.3-19.9-3.2 c-1.6-0.5-3.2-1-4.8-1.5l-2.4-0.8c-0.8-0.3-1.6-0.6-2.3-0.9l-2.3-1l-2.2-1l-2.3-1.1l-2.2-1c-5.8-2.8-11.6-5.4-17.6-7.8 c-5.9-2.3-12-4.4-18.1-5.8c-6.1-1.4-12.3-2.2-18.4-1.8c-3,0.2-6.1,0.7-9,1.4c-2.9,0.8-5.7,1.9-8.5,3.3c-2.7,1.4-5.3,3-7.7,4.9 c-2.5,1.9-4.8,3.9-7,6.1c-1.1,1.1-2.1,2.2-3.2,3.4l-1.6,1.8l-0.8,0.9c-0.2,0.2-0.5,0.6-0.7,0.9l-1.4,1.8l-1.3,1.9l-0.6,0.9l-0.6,1 l-1.2,2C41,57.1,38.9,63,37.7,69.1c-1.3,6.1-1.8,12.4-1.9,18.7c-0.1,6.3,0.4,12.7,1.2,19c1.6,12.6,4.6,25.1,8.4,37.3l1.5,4.6 c0.5,1.6,1,3.3,1.4,4.9c0.3,1.7,0.6,3.4,0.7,5.1c0.2,1.7,0.1,3.5,0,5.2c-0.3,3.5-1.2,7-2.8,10c-0.4,0.8-0.9,1.5-1.3,2.2 c-0.5,0.7-1,1.4-1.6,2C42.1,179.6,40.8,180.7,39.3,181.4z M46.1,168.3c0,0-0.1,0-0.3,0c-0.2,0-0.6-0.1-1.1-0.1c-1-0.1-2.5-0.1-4.4-0.1c-1.9,0.1-4.3,0.3-6.6,1.1 c-1.1,0.4-2.3,1-3.1,1.8c-0.1,0.1-0.2,0.2-0.3,0.3l-0.1,0.1l-0.2,0.3c-0.3,0.3-0.6,0.7-0.8,1.1c-0.5,0.7-1.1,1.4-1.6,2.1 c-4.4,6-9.3,13.9-14,23.4c-4.7,9.5-9.3,20.6-13.1,33c-3.9,12.5-7.2,26.3-9.4,41.1c-1.1,7.4-2.1,15.1-2.7,22.9 c-0.2,2-0.3,3.9-0.4,5.9c-0.1,2-0.3,4-0.3,6c-0.1,4-0.3,8.1-0.3,12.2c-0.1,8.2,0.1,16.6,0.5,24.9c0.1,1.9,0.5,3.8,1.1,5.4 c0.6,1.6,1.5,3,2.7,4.2c2.5,2.3,6.3,3.6,10.2,4.5c4,0.8,8.2,1.2,12.5,1.4c4.3,0.2,8.6,0.3,13,0.3c4.4,0,8.8,0,13.1-0.1 c2.2-0.1,4.3-0.1,6.4-0.3c2.1-0.2,4.2-0.4,6-0.9c0.9-0.2,1.7-0.5,2.4-0.9c0.6-0.4,1-0.7,1.2-1.1c0.5-0.8,0.7-2.7,0.5-4.7 c-0.3-4-1.2-8.5-1.8-12.8c-1.3-8.8-2-17.7-2-26.5c0-17.4,1.3-34.7,4.2-51.2c1.5-8.2,3.3-16.3,5.5-24c2.2-7.7,4.9-15.2,7.8-22.3 c5.9-14.2,13.2-26.8,20.2-38.1c1.8-2.8,3.3-5.5,5.3-8.3c1.9-2.7,3.9-5.1,5.8-7.5c1.9-2.3,3.8-4.6,5.6-6.8c1.8-2.2,3.6-4.3,5.3-6.3 c6.9-8.1,11.9-15.7,15.2-22.5c3.3-6.8,4.9-12.6,5.7-16.6c0.4-2,0.7-3.6,0.8-4.6c0.1-1.1,0.2-1.6,0.2-1.6s0,0.6,0.1,1.6 c0.1,1.1,0.2,2.7,0.1,4.8c-0.1,2.1-0.2,4.7-0.8,7.7c-0.5,3-1.4,6.5-2.7,10.2c-1.4,3.7-3.2,7.7-5.6,11.8c-2.4,4.1-5.3,8.4-8.5,12.7 c-1.6,2.2-3.4,4.4-5.2,6.6c-1.8,2.2-3.7,4.4-5.6,6.8c-1.9,2.3-3.8,4.7-5.5,7.2c-1.7,2.3-3.4,5.2-5.1,8 c-6.9,11.2-14,23.4-19.7,37.2c-2.9,6.9-5.4,14.1-7.6,21.6c-2.2,7.5-4,15.3-5.4,23.4c-2.9,16.1-4.1,32.9-4.1,50.2 c0,8.5,0.6,17.1,1.9,25.6c0.3,2.2,0.7,4.3,1,6.5c0.3,2.2,0.7,4.4,0.9,6.8c0.1,1.2,0.1,2.4,0,3.8c-0.1,1.3-0.5,2.9-1.3,4.4 c-0.8,1.5-2.2,2.7-3.5,3.4c-1.3,0.7-2.6,1.1-3.8,1.5c-2.4,0.6-4.8,0.8-7,1c-2.3,0.2-4.5,0.3-6.7,0.3c-4.5,0.1-8.9,0.1-13.3,0.1 c-4.4,0-8.8,0-13.3-0.3c-4.4-0.2-8.9-0.6-13.4-1.6c-2.2-0.5-4.5-1.1-6.7-2c-2.2-0.9-4.5-2.2-6.4-4c-1.9-1.8-3.4-4.1-4.2-6.5 c-0.9-2.4-1.3-4.8-1.4-7.1c-0.4-8.6-0.7-17-0.5-25.4c0-4.2,0.2-8.3,0.3-12.4c0.1-2,0.2-4.1,0.3-6.1c0.1-2,0.2-4,0.4-6 c0.6-8,1.6-15.8,2.7-23.3c2.3-15.1,5.6-29.2,9.6-42c4-12.8,8.7-24.1,13.5-33.9c4.8-9.8,9.8-17.9,14.5-24.3 c0.6-0.8,1.2-1.6,1.8-2.3c0.3-0.4,0.6-0.7,0.8-1.1l0.2-0.3l0.3-0.4c0.2-0.2,0.4-0.4,0.6-0.6c1.7-1.6,3.5-2.5,5.2-3.1 c3.3-1.1,6.1-1.3,8.3-1.5c2.2-0.1,3.9,0,5.1,0.1c0.6,0,1,0.1,1.3,0.1c0.3,0,0.5,0.1,0.5,0.1L46.1,168.3z',
  },
};
/* eslint-enable max-len */

type PropTypes = Pick<CutieMark, 'facing' | 'rotation'> & Pick<Appearance, 'colorGroups'>;

export const CutieMarkPreview: VFC<PropTypes> = ({ facing = 'left', colorGroups }) => {
  const fixedFacing = facing === null ? 'left' : facing;
  const colorMap = useMemo(() => getColorMapping(colorGroups, DEFAULT_COLOR_MAPPING), [colorGroups]);
  const uid = useMemo(() => uniqueId(), []);
  const opacityMaskId = `opacity_mask${uid}`;
  const opacityMaskFilterId = `opacity_mask_filter${uid}`;
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 175 175"
      enableBackground="new 0 0 175 175"
      xmlSpace="preserve"
      aria-hidden="true"
    >
      <defs>
        <filter id={opacityMaskFilterId} filterUnits="userSpaceOnUse" x="-48.8" y="-30.1" width="270.7" height="396.2">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>
      <mask maskUnits="userSpaceOnUse" x="-48.8" y="-30.1" width="270.7" height="396.2" id={opacityMaskId}>
        <g filter={`url(#${encodeURIComponent(opacityMaskFilterId)})`}>
          <rect x="6.9" y="6.9" fill="white" width="161.1" height="161.1" />
        </g>
      </mask>
      <g mask={`url(#${encodeURIComponent(opacityMaskId)})`}>
        <path
          fill={colorMap['Mane & Tail Fill']}
          stroke={colorMap['Mane & Tail Outline']}
          strokeWidth="6"
          strokeMiterlimit="10"
          d={CM_PREVIEW_PATHS[fixedFacing].tail}
        />
        <path
          fill={colorMap['Coat Shadow Fill']}
          stroke={colorMap['Coat Shadow Outline']}
          strokeWidth="6"
          strokeMiterlimit="10"
          d={CM_PREVIEW_PATHS[fixedFacing].bodyShadowFill}
        />
        <path fill={colorMap['Coat Fill']} d={CM_PREVIEW_PATHS[fixedFacing].bodyFill} />
        <path fill={colorMap['Coat Outline']} d={CM_PREVIEW_PATHS[fixedFacing].bodyOutline} />
      </g>
    </svg>
  );
};

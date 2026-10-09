import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import './style.css';
const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
createRoot(root).render(<React.StrictMode><MotionConfig reducedMotion="user"><App /></MotionConfig></React.StrictMode>);

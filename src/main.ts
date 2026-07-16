import { initScene } from './scene';
import { mountJsmePanel } from './ui/jsme-panel';
import { setupControls } from './ui/controls';
import { EXAMPLES } from './data/examples';

function setupSplitter() {
  const splitter = document.getElementById('splitter')!;
  const jsmePanel = document.getElementById('jsme-panel')!;
  let dragging = false;

  splitter.addEventListener('pointerdown', (e) => {
    dragging = true;
    splitter.classList.add('active');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  });

  splitter.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const w = Math.max(280, Math.min(e.clientX, window.innerWidth - 200));
    jsmePanel.style.width = w + 'px';
    window.dispatchEvent(new Event('resize'));
    if ((window as any).jsmeApplet) {
      (window as any).jsmeApplet.repaint();
    }
  });

  splitter.addEventListener('pointerup', () => {
    dragging = false;
    splitter.classList.remove('active');
    if ((window as any).jsmeApplet) {
      setTimeout(() => (window as any).jsmeApplet.repaint(), 50);
    }
  });
}

function setupExamples() {
  const dropdown = document.getElementById('examples-dropdown') as HTMLSelectElement;
  const renderBtn = document.getElementById('render-btn') as HTMLButtonElement;

  dropdown.addEventListener('change', () => {
    const idx = parseInt(dropdown.value);
    if (isNaN(idx)) return;
    const ex = EXAMPLES[idx];
    if (!ex) return;

    const applet = (window as any).jsmeApplet;
    if (!applet) return;

    applet.readMolFile(ex.mol);
    dropdown.selectedIndex = 0;
    renderBtn.click();
  });
}

async function main() {
  const scene = initScene(document.getElementById('canvas-container')!);
  mountJsmePanel(document.getElementById('jsme-panel')!, scene);
  setupControls(scene);
  setupSplitter();
  setupExamples();
}

main();

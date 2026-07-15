import * as THREE from 'three';
import type { SceneContext } from '../scene';

export function setupControls(ctx: SceneContext) {
  const panel = document.getElementById('controls-panel')!;
  const rerender = () => setTimeout(() => ctx.rerender(), 10);

  // Show Atoms & Bonds
  const molToggle = panel.querySelector<HTMLInputElement>('#ctrl-show-mol')!;
  molToggle.checked = true;
  molToggle.addEventListener('change', () => {
    ctx.moleculeGroup.visible = molToggle.checked;
  });

  // Show Orbitals
  const orbToggle = panel.querySelector<HTMLInputElement>('#ctrl-show-orb')!;
  orbToggle.addEventListener('change', () => {
    ctx.orbitalGroup.visible = orbToggle.checked;
  });

  // Atom Scale
  const atomScale = panel.querySelector<HTMLInputElement>('#ctrl-atom-scale')!;
  atomScale.addEventListener('input', () => {
    ctx.display.atomScale = parseFloat(atomScale.value);
    rerender();
  });

  // Bond Scale
  const bondScale = panel.querySelector<HTMLInputElement>('#ctrl-bond-scale')!;
  bondScale.addEventListener('input', () => {
    ctx.display.bondScale = parseFloat(bondScale.value);
    rerender();
  });

  // Atom Labels
  const labelsToggle = panel.querySelector<HTMLInputElement>('#ctrl-show-labels')!;
  labelsToggle.addEventListener('change', () => {
    ctx.display.showLabels = labelsToggle.checked;
    ctx.labelGroup.visible = labelsToggle.checked;
  });

  // Orbital Presets (only .preset-btn, not .bg-btn)
  const presetBtns = panel.querySelectorAll<HTMLButtonElement>('.preset-btn');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ctx.display.orbitalPreset = btn.dataset.preset as 'glass' | 'glossy' | 'matte';
      rerender();
    });
  });

  // Background presets
  const bgBtns = panel.querySelectorAll<HTMLButtonElement>('.bg-btn');
  const bgCustom = panel.querySelector<HTMLInputElement>('#ctrl-bg-custom')!;
  const setBg = (hex: string) => {
    ctx.display.bgColor = hex;
    ctx.scene.background = new THREE.Color(hex);
    bgCustom.value = hex;
    bgBtns.forEach((b) => b.classList.toggle('active', b.dataset.bg === hex));
  };
  bgBtns.forEach((btn) => {
    btn.addEventListener('click', () => setBg(btn.dataset.bg!));
  });
  bgCustom.addEventListener('input', () => {
    setBg(bgCustom.value);
  });

  // Export PNG
  const exportBtn = panel.querySelector<HTMLButtonElement>('#ctrl-export-png')!;
  exportBtn.addEventListener('click', () => {
    const scale = 2;
    const w = ctx.renderer.domElement.width;
    const h = ctx.renderer.domElement.height;
    ctx.renderer.setSize(w * scale, h * scale, false);
    ctx.renderer.render(ctx.scene, ctx.camera);
    const dataUrl = ctx.renderer.domElement.toDataURL('image/png');
    ctx.renderer.setSize(w, h, false);
    ctx.renderer.render(ctx.scene, ctx.camera);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'molecule.png';
    a.click();
  });

  // Cite dialog
  const citeBtn = document.getElementById('cite-btn')!;
  const citeDialog = document.getElementById('cite-dialog')!;
  citeBtn.addEventListener('click', () => citeDialog.classList.remove('hidden'));
  document.getElementById('cite-close')!.addEventListener('click', () => citeDialog.classList.add('hidden'));
  citeDialog.addEventListener('click', (e) => { if (e.target === citeDialog) citeDialog.classList.add('hidden'); });

  document.getElementById('cite-copy')!.addEventListener('click', async () => {
    const text = document.getElementById('cite-text')!.textContent || '';
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('cite-copy')!;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy to clipboard'; }, 2000);
  });
}

import * as THREE from 'three';

const ELEMENT_NAMES: Record<string, string> = {
  H: 'hydrogen', He: 'helium',
  Li: 'lithium', Be: 'beryllium', B: 'boron',
  C: 'carbon', N: 'nitrogen', O: 'oxygen', F: 'fluorine', Ne: 'neon',
  Na: 'sodium', Mg: 'magnesium', Al: 'aluminium',
  Si: 'silicon', P: 'phosphorus', S: 'sulfur', Cl: 'chlorine', Ar: 'argon',
  K: 'potassium', Ca: 'calcium',
  Fe: 'iron', Cu: 'copper', Zn: 'zinc', Mn: 'manganese',
  Br: 'bromine', I: 'iodine',
};

export function setupTooltip(container: HTMLElement, camera: THREE.Camera, ...groups: THREE.Group[]) {
  const tooltip = document.getElementById('tooltip')!;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const allObjects: THREE.Object3D[] = [];

  function refreshObjects() {
    allObjects.length = 0;
    for (const g of groups) {
      g.children.forEach((child) => {
        if (child instanceof THREE.Mesh) allObjects.push(child);
      });
    }
  }

  container.addEventListener('pointermove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    refreshObjects();
    if (allObjects.length === 0) { tooltip.classList.add('hidden'); return; }

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allObjects, false);

    if (hits.length > 0) {
      const obj = hits[0].object;
      const d = obj.userData;
      let text = '';
      const idx = d.atomIndex !== undefined ? d.atomIndex + 1 : '';

      if (d.lobeType === 'atom') {
        text = `${d.element}${idx} ${ELEMENT_NAMES[d.element] || d.element}`;
      } else if (d.lobeType === '1s') {
        text = `${d.element}${idx} 1s`;
      } else if (d.lobeType === 'sigma') {
        text = `${d.element}${idx} ${d.label}`;
      } else if (d.lobeType === 'pi') {
        text = `${d.element}${idx} p`;
      } else if (d.lobeType === 'lone_pair') {
        text = `${d.element}${idx} ${d.label}`;
      }

      tooltip.textContent = text;
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY - 8) + 'px';
      tooltip.classList.remove('hidden');
      container.style.cursor = 'default';
    } else {
      tooltip.classList.add('hidden');
      container.style.cursor = '';
    }
  });
}

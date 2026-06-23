import { MATERIALS, CRAFTING_RECIPES } from './config';

let inventory: Record<string, number> = {};

export function addMaterial(type: string) {
  inventory[type] = (inventory[type] || 0) + 1;
}

export function getInventory(): Record<string, number> {
  return inventory;
}

export function canCraft(recipeIndex: number): boolean {
  const recipe = CRAFTING_RECIPES[recipeIndex];
  if (!recipe) return false;

  const materialCounts: Record<string, number> = {};
  for (const mat of recipe.materials) {
    if (mat !== 'weapon' && mat !== 'upgrade') {
      materialCounts[mat] = (materialCounts[mat] || 0) + 1;
    }
  }

  for (const [mat, count] of Object.entries(materialCounts)) {
    if ((inventory[mat] || 0) < count) {
      return false;
    }
  }

  return true;
}

export function craft(recipeIndex: number): { success: boolean; result: string; type: string } {
  if (!canCraft(recipeIndex)) {
    return { success: false, result: '', type: '' };
  }

  const recipe = CRAFTING_RECIPES[recipeIndex];

  for (const mat of recipe.materials) {
    if (mat !== 'weapon' && mat !== 'upgrade') {
      inventory[mat]--;
    }
  }

  return { success: true, result: recipe.result, type: recipe.resultType };
}

export function resetCrafting() {
  inventory = {};
}

export function drawCraftingMenu(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mouseX: number, mouseY: number) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CRAFTING', x + width / 2, y + 25);

  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Materiais:', x + 10, y + 50);

  let matY = y + 70;
  for (const mat of MATERIALS) {
    const count = inventory[mat.type] || 0;
    ctx.fillStyle = mat.color;
    ctx.fillText(`${mat.name}: ${count}`, x + 10, matY);
    matY += 20;
  }

  ctx.fillStyle = '#aaa';
  ctx.fillText('Receitas:', x + 10, matY + 10);

  let recY = matY + 30;
  CRAFTING_RECIPES.forEach((recipe, i) => {
    const canMake = canCraft(i);
    ctx.fillStyle = canMake ? '#2ecc71' : '#666';
    const text = `${recipe.materials.join(' + ')} = ${recipe.result}`;
    ctx.fillText(text, x + 10, recY);

    if (canMake && mouseX >= x + 10 && mouseX <= x + width - 10 && mouseY >= recY - 12 && mouseY <= recY + 4) {
      ctx.strokeStyle = '#f1c40f';
      ctx.strokeRect(x + 8, recY - 14, width - 16, 18);
    }

    recY += 25;
  });
}

export function handleCraftingClick(mouseX: number, mouseY: number, menuX: number, menuY: number, menuWidth: number, menuHeight: number): boolean {
  if (mouseX < menuX || mouseX > menuX + menuWidth || mouseY < menuY || mouseY > menuY + menuHeight) {
    return false;
  }

  const matCount = MATERIALS.length;
  const recStartY = menuY + 70 + matCount * 20 + 30;

  for (let i = 0; i < CRAFTING_RECIPES.length; i++) {
    const recY = recStartY + i * 25;
    if (mouseY >= recY - 12 && mouseY <= recY + 4) {
      const result = craft(i);
      return result.success;
    }
  }

  return false;
}

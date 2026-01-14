# Goal Card Template

A pastel artistic glass-morphism goal card component for the Sprint page.

---

## Preview

Each goal card features:
- Decorative corner accent (pastel gradient)
- Clickable icon with icon picker
- Editable title and label
- Expandable details with progress bar and action items

---

## CSS

```css
/* Goals Container */
.goals-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 40px;
    align-items: start;
}

/* Goal Card */
.goal-slot {
    background: rgba(255, 255, 255, 0.4);
    border: 1px dashed rgba(0, 0, 0, 0.1);
    border-radius: 28px;
    padding: 28px;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

/* Decorative Corner Accent */
.goal-slot::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle at top right, var(--goal-tint, #e0f5e0), transparent 70%);
    opacity: 0.4;
    transition: all 0.4s ease;
}

/* Hover State */
.goal-slot:hover {
    border-color: #8eb8bf;
    background: rgba(255, 255, 255, 0.7);
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.06);
}

.goal-slot:hover::before {
    opacity: 0.6;
    width: 100px;
    height: 100px;
}

/* Filled State */
.goal-slot.filled {
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.5));
    justify-content: flex-start;
    padding-top: 32px;
}

/* Goal Icon */
.goal-icon {
    font-size: 36px;
    margin-bottom: 14px;
    opacity: 0.9;
    transition: all 0.3s ease;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
}

.goal-icon:hover {
    background: rgba(0,0,0,0.05);
    transform: scale(1.1);
}

/* Goal Label (Pill Badge) */
.goal-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 700;
    opacity: 0.5;
    margin-top: 10px;
    padding: 4px 12px;
    background: rgba(0,0,0,0.03);
    border-radius: 20px;
}

/* Expanded State */
.goal-slot.expanded {
    min-height: 400px;
    background: #fff;
    border-color: #a8c5b5;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
    transform: scale(1.03);
    z-index: 50;
}

.goal-slot.expanded::before {
    width: 150px;
    height: 150px;
    opacity: 0.3;
}

/* Goal Details (Hidden by default) */
.goal-details {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.5s ease;
    width: 100%;
    text-align: left;
    margin-top: 0;
}

.goal-slot.expanded .goal-details {
    max-height: 500px;
    opacity: 1;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* Progress Bar */
.goal-progress-mini {
    height: 8px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    margin: 12px 0;
    overflow: hidden;
    cursor: pointer;
}

.goal-progress-fill {
    height: 100%;
    background: #a8c5b5;
    border-radius: 10px;
    transition: width 0.4s ease;
}
```

---

## HTML Template

```html
<!-- Filled Goal Card -->
<div class="goal-slot filled" 
     style="--goal-tint: var(--pastel-green);" 
     onclick="this.classList.toggle('expanded')">
    <div>
        <i class="ph ph-plant goal-icon"
           onclick="event.stopPropagation(); openIconPicker(this)"
           style="color: #88c999;"></i>
        <h3 contenteditable="true" 
            onclick="event.stopPropagation()"
            style="font-family: 'Cormorant Garamond', serif; font-size: 26px; font-style: italic; margin: 0;">
            Goal Title</h3>
        <div class="goal-label" contenteditable="true" onclick="event.stopPropagation()">
            Category</div>
    </div>

    <!-- Expandable Details -->
    <div class="goal-details">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.5;">
            Progress</div>
        <div class="goal-progress-mini">
            <div class="goal-progress-fill" style="width: 65%;"></div>
        </div>

        <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.5; margin-top: 16px;">
            Daily Actions</div>
        <ul class="action-list">
            <li class="action-item done">
                <i class="ph ph-check-circle"></i> 
                <span contenteditable="true" onclick="event.stopPropagation()">Action 1</span>
            </li>
            <li class="action-item">
                <i class="ph ph-circle"></i> 
                <span contenteditable="true" onclick="event.stopPropagation()">Action 2</span>
            </li>
        </ul>

        <p contenteditable="true" onclick="event.stopPropagation()"
           style="font-size: 12px; opacity: 0.6; margin-top: 20px; font-style: italic;">
            "Motivational quote here."
        </p>
    </div>
</div>

<!-- Empty Goal Card -->
<div class="goal-slot" style="--goal-tint: var(--pastel-purple);">
    <div style="opacity: 0.5;">
        <i class="ph ph-plus goal-icon" style="color: #b39ddb;"></i>
        <div contenteditable="true"
             style="font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; margin-top: 8px;">
            Set Goal</div>
        <div class="goal-label">Click to add</div>
    </div>
</div>
```

---

## Pastel Tint Options

| Variant | CSS Variable | Hex Color |
|---------|--------------|-----------|
| Green   | `--pastel-green` | `#88c999` |
| Blue    | `--pastel-blue`  | `#8da4ef` |
| Purple  | `--pastel-purple`| `#b39ddb` |
| Pink    | `--pastel-pink`  | `#f2a5a5` |
| Orange  | `--pastel-orange`| `#f5b97a` |

---

## Usage Notes

1. **Icon Picker**: Requires the `openIconPicker(element)` JS function.
2. **Expand/Collapse**: Click card to toggle `.expanded` class.
3. **Inline Editing**: All text with `contenteditable="true"` is editable.
4. **Progress Bar**: Adjust `width` on `.goal-progress-fill` to change progress.

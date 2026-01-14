# Habit Tracker Template

A pastel artistic habit tracker with interactive "day orbs" and editable icons.

---

## Preview

Each habit card features:
- Clickable icon (opens icon picker)
- Editable title, description, and streak
- 7 interactive "day orbs" for tracking completion
- Week-aware data (syncs with Week 1/Week 2 toggle)

---

## CSS

```css
/* Section Title */
.habit-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.5rem;
    font-style: italic;
    color: #2f3a46;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.habit-section-title::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, rgba(0,0,0,0.1), transparent);
}

/* Habits Container */
.habits-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 24px;
    margin-bottom: 60px;
}

/* Habit Card */
.art-habit-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24px;
    padding: 24px;
    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

/* Tinted background wash */
.art-habit-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--card-tint), transparent 60%);
    opacity: 0.5;
    z-index: 0;
}

/* Hover State */
.art-habit-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.06);
    border-color: var(--tint-color);
}

.art-habit-card:hover::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, var(--card-tint), transparent 50%);
    opacity: 0.3;
    pointer-events: none;
}

/* Header */
.habit-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
    margin-bottom: 20px;
}

.habit-info h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-style: italic;
    margin: 0;
    color: #2f3a46;
}

/* Streak Badge */
.habit-streak {
    font-size: 12px;
    font-weight: 700;
    color: #d97706;
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(217, 119, 6, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
}

/* Icon Trigger */
.habit-icon-trigger {
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 4px;
    border-radius: 8px;
}

.habit-icon-trigger:hover {
    background: rgba(0,0,0,0.05);
    transform: scale(1.1);
}

/* Week Visual (Orb Row) */
.habit-week-visual {
    display: flex;
    justify-content: space-between;
    position: relative;
    z-index: 1;
    padding-top: 16px;
    border-top: 1px dashed rgba(0,0,0,0.05);
}

/* Day Orb Container */
.day-orb-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.day-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
    font-weight: 700;
}

/* Day Orb */
.day-orb {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--tint-color);
    background: transparent;
    position: relative;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Inner Fill (hidden by default) */
.day-orb::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--tint-color);
    opacity: 0;
    transform: scale(0);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover State */
.day-orb-container:hover .day-orb {
    border-color: var(--tint-color);
    box-shadow: 0 0 0 4px var(--tint-shadow);
    transform: scale(1.1);
}

/* Completed State */
.day-orb.completed {
    border-color: transparent;
    box-shadow: 0 4px 10px var(--tint-shadow);
}

.day-orb.completed::after {
    opacity: 1;
    transform: scale(1);
}

.day-orb.completed i {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

/* Check Icon */
.day-orb i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 14px;
    color: white;
    z-index: 2;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 0;
}

/* Splash Animation */
@keyframes splash {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}
```

---

## HTML Template

```html
<!-- Section Title -->
<h2 class="habit-section-title">
    <i class="ph ph-sparkle" style="font-size: 28px; color: #8eb8bf;"></i>
    Daily Rituals
</h2>

<div class="habits-container">

    <!-- Habit Card -->
    <div class="art-habit-card" data-habit="reading"
         style="--card-tint: var(--pastel-blue); --tint-color: #8da4ef; --tint-shadow: rgba(141, 164, 239, 0.3);">
        
        <div class="habit-header">
            <div class="habit-info">
                <i class="ph ph-book-open habit-icon-trigger"
                   onclick="openIconPicker(this)"
                   style="font-size: 24px; color: #8da4ef; margin-bottom: 8px;"></i>
                <h3 contenteditable="true">Reading</h3>
                <p contenteditable="true" style="font-size: 13px; opacity: 0.6; margin-top: 4px;">
                    30 mins fiction</p>
            </div>
            <div class="habit-streak">
                <i class="ph ph-flame"></i> 
                <span contenteditable="true">12</span> Days
            </div>
        </div>

        <div class="habit-week-visual">
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">M</span>
                <div class="day-orb completed"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">T</span>
                <div class="day-orb completed"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">W</span>
                <div class="day-orb"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">T</span>
                <div class="day-orb"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">F</span>
                <div class="day-orb"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">S</span>
                <div class="day-orb"><i class="ph ph-check"></i></div>
            </div>
            <div class="day-orb-container" onclick="this.querySelector('.day-orb').classList.toggle('completed')">
                <span class="day-label">S</span>
                <div class="day-orb"><i class="ph ph-check"></i></div>
            </div>
        </div>
    </div>

    <!-- Add New Habit Card -->
    <div class="art-habit-card"
         style="display: flex; align-items: center; justify-content: center; border-style: dashed; opacity: 0.6; cursor: pointer; min-height: 200px;">
        <div style="text-align: center;">
            <i class="ph ph-plus" style="font-size: 32px; color: #6b7280; margin-bottom: 8px;"></i>
            <div style="font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic;">
                New Ritual</div>
        </div>
    </div>

</div>
```

---

## Color Variants

| Variant | `--card-tint` | `--tint-color` | `--tint-shadow` |
|---------|---------------|----------------|-----------------|
| Blue    | `var(--pastel-blue)` | `#8da4ef` | `rgba(141, 164, 239, 0.3)` |
| Green   | `var(--pastel-green)` | `#88c999` | `rgba(136, 201, 153, 0.3)` |
| Purple  | `var(--pastel-purple)` | `#b39ddb` | `rgba(179, 157, 219, 0.3)` |
| Pink    | `var(--pastel-pink)` | `#f2a5a5` | `rgba(242, 165, 165, 0.3)` |
| Cyan    | `var(--pastel-blue)` | `#64b5f6` | `rgba(100, 181, 246, 0.3)` |

---

## JavaScript (Week Toggle)

```javascript
let currentWeek = 1;

const habitWeekData = {
    1: {
        reading: [true, true, true, false, false, false, false],
        mindfulness: [true, true, false, false, false, false, false]
    },
    2: {
        reading: [false, false, false, false, false, false, false],
        mindfulness: [false, false, false, false, false, false, false]
    }
};

function switchWeek(week) {
    currentWeek = week;
    
    document.querySelectorAll('.art-habit-card[data-habit]').forEach(card => {
        const habitName = card.dataset.habit;
        const weekData = habitWeekData[week][habitName];
        if (weekData) {
            const orbs = card.querySelectorAll('.day-orb');
            orbs.forEach((orb, index) => {
                orb.classList.toggle('completed', weekData[index]);
            });
        }
    });
}
```

---

## Usage Notes

1. **Icon Picker**: Requires `openIconPicker(element)` JS function.
2. **Week Toggle**: Use `data-habit` attribute to sync with week data.
3. **Inline Editing**: Title, description, and streak are all `contenteditable`.
4. **Day Orbs**: Click to toggle `.completed` class.

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
/* ******************************************* */
/* ******************************************* */
const labels = {
  monthsShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
};

/**
 * Context
 * @description manage dates
 */
class Context {
  constructor() {
    this.date = new Date();
    this.dateSelected = 1;
    this.daySelected = this.date.getDate();
    this.monthSelected = this.date.getMonth();
    this.yearSelected = this.date.getFullYear();
    this.month = this.getMonth();
    this.week = this.getWeek();
  }

  setDay(day) {
    this.daySelected = day;
  }

  setMonth(month) {
    this.monthSelected = month;
  }

  setYear(year) {
    this.yearSelected = year;
  }

  setDate(year, month, day) {
    this.setYear(year);
    this.setMonth(month);
    this.setDay(day);
  }

  setDateSelected(date) {
    this.dateSelected = date;
  }

  setPrevWeek() {
    const prevWeek = new Date(
      this.getYear(), this.getMonth(), this.getDay() - 7
    );

    this.setDate(
      prevWeek.getFullYear(), prevWeek.getMonth(), prevWeek.getDate()
    );
  }

  setNextWeek() {
    const nextWeek = new Date(this.getYear(), this.getMonth(), this.getDay() + 7);
    this.setDate(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
  }

  getDateSelected() { return +this.dateSelected; }
  getDay() { return +this.daySelected; }
  getMonth() { return +this.monthSelected; }
  getYear() { return this.date.getFullYear(); }
  getToday() { return this.date; }
  getWeekday() { return this.getDate().getDay(); }

  getDate() {
    return new Date(this.getYear(), this.getMonth(), this.getDay());
  }

  getWeek() {
    let tempdate = this.getDate();
    tempdate.setDate(tempdate.getDate() - tempdate.getDay());
    return tempdate;
  }

  getWeekArray() {
    let week = this.getWeek();
    let weekArray = [];
    for (let i = 0; i < 7; i++) {
      if (i < 6) {
        weekArray.push(new Date(week.getFullYear(), week.getMonth(), week.getDate() + i));
      } else {
        weekArray.push(new Date(week.getFullYear(), week.getMonth(), week.getDate() + i, 23, 59, 59, 999));
      }
    }
    return weekArray;
  }

  getWeekRange() {
    let weekArray = this.getWeekArray();
    let [m1, m2] = [weekArray[0].getMonth(), weekArray[6].getMonth()];
    let [d1, d2] = [weekArray[0].getDate(), weekArray[6].getDate()];

    if (m1 === m2) {
      return `${labels.monthsShort[m1]} ${d1} – ${d2}, ${weekArray[0].getFullYear()}`;
    } else {
      return `${labels.monthsShort[m1]} ${d1} – ${d2} ${labels.monthsShort[m2]}, ${weekArray[1].getFullYear()}`;
    }
  }
}

/* ******************************************* */
/**
 * Entry
 * @description factory Class to create Entry
 */
class Entry {
  constructor(category, completed, description, end, start, title) {
    this.category = category;
    this.completed = completed;
    this.description = description;
    this.end = end;
    this.id = this.generateId();
    this.start = start;
    this.title = title;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}


/* ******************************************* */
/**
 * Store
 * @description store, manipulate all entries
 */
class Store {
  constructor(entries) {
    this.store = entries;
    this.ctg = { default: { color: "#2C52BA", active: true } };
  }

  addEntry(entry) { this.store.push(entry); }
  createEntry(...args) { this.addEntry(new Entry(...args)); }
  setNewStore(newEntries) { this.store = newEntries; }
  getEntries() { return this.store || []; }

  getEntry(id) {
    return this.store.find((entry) => entry.id === id);
  }

  updateEntry(id, data) {
    let entry = this.getEntry(id);
    entry = Object.assign(entry, data);
  }

  testDate(date) {
    return date instanceof Date && !isNaN(date) ? date : new Date(date);
  }

  formatWeekMinutes(date) {
    return date.getHours() * 4 + Math.floor(date.getMinutes() / 15);
  }

  generateCoordinates(start, end) {
    [start, end] = [this.testDate(start), this.testDate(end)];
    const [startMin, endMin] = [
      this.formatWeekMinutes(start), this.formatWeekMinutes(end)
    ];
    const height = endMin - startMin;
    const total = startMin + height;
    return {
      allDay: false,
      x: start.getDay(),
      y: startMin,
      h: height,
      e: total,
    };
  }

  getWeekEntries(week) {
    let [start, end] = [week[0], week[6]];
    let boxes = { allDay: [], day: [] };

    let entries = this.getEntries().filter((entry) => {
      let entryDate = new Date(entry.start);
      return entryDate >= start && entryDate <= end;
    });

    entries.forEach((entry) => {
      entry.coordinates = this.generateCoordinates(
        new Date(entry.start),
        new Date(entry.end)
      );
      boxes.day.push(entry);
    });
    return boxes.day;
  }
}


/* ******************************************* */
/**
 * Week
 * @description manage grid actions
 */
class Week {
  constructor(entries) {
    this.boxes = entries;
  }

  setAllBoxes(tempEntries) { this.boxes = tempEntries.day; }
  addBox(box) { this.boxes.push(box); }
  getBox(id) { return this.boxes.find(box => box.id === id); }
  getBoxes() { return this.boxes; }
  getLength() { return this.boxes.length; }
  getBoxesByColumn(col) {
    return this.boxes.filter(box => +box.coordinates.x == col);
  }

  getColumnsWithMultipleBoxes() {
    let temp = {};
    let columns = [];
    for (const box of this.boxes) {
      if (temp[box.coordinates.x]) {
        temp[box.coordinates.x]++;
        if (temp[box.coordinates.x] === 2) {
          columns.push(box.coordinates.x);
        }
      } else {
        temp[box.coordinates.x] = 1;
      }
    }
    return columns;
  }

  getEntriesByTitle(title) {
    return this.boxes.filter(box => box.title.toLowerCase().includes(title.toLowerCase()));
  }

  updateCoordinates(id, coordinates) {
    this.getBox(id).coordinates = coordinates;
  }

  checkForCollision(col) {

    const bxs = this.getBoxesByColumn(col);
    let overlaps = [];
    for (let i = 0; i < bxs.length; i++) {
      for (let j = i + 1; j < bxs.length; j++) {
        const e1 = bxs[i];
        const e2 = bxs[j];
        if (e1.coordinates.y < e2.coordinates.e && e1.coordinates.e > e2.coordinates.y) {
          if (!overlaps.includes(e1)) {
            overlaps.push(e1);
          }
          if (!overlaps.includes(e2)) {
            overlaps.push(e2);
          }
        }
      }
    }
    return overlaps.sort((a, b) => +a.coordinates.y - +b.coordinates.y);
  }

  updateStore(store, id, weekArray) {
    const boxEntry = this.getBox(id);
    const coords = boxEntry.coordinates;
    let day = weekArray[+coords.x];

    const format = (day, n) => {
      const date = new Date(day);
      const hours = Math.floor(n / 60);
      const mins = n % 60;
      date.setHours(hours);
      date.setMinutes(mins);
      return date;
    };
    store.updateEntry(id, {
      start: format(day, +coords.y * 15),
      end: format(day, +coords.e * 15),
    });
  }
}

/* ******************************************* */
// the following are helper functions that allow the drag/resize/creation functions to work. With just the weekview implemented, this is a somewhat convoluted/confusing approach so I apologize. It is meant to be extensible to both the week/day views
const identifiers = {
  boxnumarr: {
    week: [
      'box-one', 'box-two', 'box-three',
      'box-four', 'box-five', 'box-six',
      'box-seven', 'box-eight', 'box-nine',
      'box-ten', 'box-eleven', 'box-twelve',
      'box-thirteen', 'box-fourteen', 'box-fifteen',
    ],
  },

  boxClasses: {
    week: {
      base: "box",
      ontop: "box-ontop",
      active: "box-mv-dragactive",
      temporary: "temporary-box",
      prepend: "box-",
    },
  },

  boxAttributes: {
    week: {
      updatecoord: [
        "data-box-id",
        "data-start-time",
        "data-time-intervals"
      ],
      dataIdx: "box-idx",
      dataId: "data-box-id",
      dataCol: "data-box-col",
      prepend: "data-",
      prepentwo: "data-wv-"
    },
  },

  styles: {
    newBox: {
      left: "calc((100% - 0px) * 0 + 0px)",
      height: "12.5px",
      width: "calc((100% - 4px) * 1)",
    }
  }
};

function formatTime(hours, minutes) {
  let md;
  if (minutes === 60) {
    minutes = 0;
    hours += 1;
  }
  if (+hours === 0) {
    hours = 12;
    md = "am";
  } else if (hours < 12) {
    md = "am";
  } else if (hours === 12) {
    md = "pm";
  } else if (hours === 24) {
    md = "am";
    hours -= 12;
  } else {
    hours -= 12;
    md = "pm";
  }

  if (+minutes === 0) {
    return `${hours}${md}`;
  } else {
    return `${hours}:${minutes}${md}`;
  }
}

function calcTime(start, length) {
  let startHours = Math.floor(+start / 4);
  let startMinutes = (+start * 15) % 60;

  let endHours = Math.floor((start + length) / 4);
  let endMinutes = ((start + length) * 15) % 60;

  let startingtime = formatTime(startHours, startMinutes);
  let endingtime = formatTime(endHours, endMinutes);

  if (startingtime.slice(-2) == endingtime.slice(-2)) {
    startingtime = startingtime.slice(0, -2);
  }

  const boxtime = `${startingtime} – ${endingtime}`;
  return boxtime;
}

// I've opted to hard code the left & width properties because there isn't really a discernable pattern in handling collisions, at least not one that my monkey brain could render
function setBoxWidthWeek(box, prepend, dataidx) {
  const attr = box.getAttribute(dataidx);
  switch (attr) {
    case `${prepend}one`:
      box.style.left = 'calc((100% - 0px) * 0 + 0px)';
      box.style.width = "calc((100% - 4px) * 1)";
      break;
    case `${prepend}two`:
      box.style.left = "calc((100% - 0px) * 0.2 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.80)";
      break;
    case `${prepend}three`:
      box.style.left = "calc((100% - 0px) * 0.45 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.55)";
      break;
    case `${prepend}four`:
      box.style.left = "calc((100% - 0px) * 0.0 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.44)";
      break;
    case `${prepend}five`:
      box.style.left = "calc((100% - 0px) * .5 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.35)";
      break;
    case `${prepend}six`:
      box.style.left = "calc((100% - 0px) * 0.1 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.4)";
      break;
    case `${prepend}seven`:
      box.style.left = "calc((100% - 0px) * 0.5 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.5)";
      break;
    case `${prepend}eight`:
      box.style.left = "calc((100% - 0px) * 0.25 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.25)";
      break;
    case `${prepend}nine`:
      box.style.left = "calc((100% - 0px) * 0.55 + 0px)";
      box.style.width = "calc((100% - 4px) * 0.35)";
      break;
    case `${prepend}ten`:
      box.style.left = "calc((100% - 0px) * 0.55 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.15)";
      break;
    case `${prepend}eleven`:
      box.style.left = "calc((100% - 0px) * 0.70 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.15)";
      break;
    case `${prepend}twelve`:
      box.style.left = "calc((100% - 0px) * 0.85 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.15)";
      break;
    case `${prepend}thirteen`:
      box.style.left = "calc((100% - 0px) * 0.05 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.25)";
      break;
    case `${prepend}fourteen`:
      box.style.left = "calc((100% - 0px) * 0.30 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.25)";
      break;
    case `${prepend}fifteen`:
      box.style.left = "calc((100% - 0px) * 0.55 + 0px)";
      box.style.width = "calc((100% - 16px) * 0.25)";
      break;
    default:
      break;
  }
}

function handleOverlap(col, view, boxes) {
  const collisions = boxes.checkForCollision(col);

  const identifyBox = identifiers.boxnumarr[view];

  const [baseClass, classPrepend] = [
    identifiers.boxClasses[view],
    identifiers.boxClasses[view].prepend,
  ];

  const [boxIdxAttr, boxIdAttr] = [
    identifiers.boxAttributes[view].dataIdx,
    identifiers.boxAttributes[view].dataId,
  ];

  for (let i = 0; i < collisions.length; i++) {
    const box = $(`[${boxIdAttr}="${collisions[i].id}"]`);
    let idx = i;
    if (i >= 15) {
      idx -= 12;
    }
    if (i === 0) {
      box.setAttribute("class", `${baseClass.base} ${identifyBox[idx]}`);
      box.setAttribute(boxIdxAttr, identifyBox[idx]);
    } else {
      box.setAttribute("class", `${baseClass.base} ${baseClass.ontop} ${identifyBox[idx]}`);
      box.setAttribute(boxIdxAttr, identifyBox[idx]);
    }
    setBoxWidthWeek(box, classPrepend, boxIdxAttr);
  }
}

function setStylingForEvent(clause) {
  const resizeoverlay = document.querySelector(".resize-overlay");
  switch (clause) {
    case "dragstart":
      resizeoverlay.classList.remove("hide-resize-overlay");
      break;
    case "dragend":
      resizeoverlay.classList.add("hide-resize-overlay");
      document.body.style.cursor = "default";
      break;
    default:
      break;
  }
}

function updateBoxCoordinates(box, view, boxes) {
  let [id, y, h] = identifiers.boxAttributes[view].updatecoord.map((x) => {
    return box.getAttribute(x);
  });
  let x = box.getAttribute("data-box-col");
  boxes.updateCoordinates(id, {
    x: parseInt(x),
    y: parseInt(y),
    h: parseInt(h),
    e: parseInt(y) + parseInt(h),
  });
}

function setBoxTimeAttributes(box, view) {
  let start = +box.style.top.split("px")[0];
  start = start >= 0 ? start / 12.5 : 0;
  let length = +box.style.height.split("px")[0] / 12.5;
  let end = start + length;
  let prepend = identifiers.boxAttributes[view].prepend;
  box.setAttribute(`${prepend}start-time`, start);
  box.setAttribute(`${prepend}time-intervals`, length);
  box.setAttribute(`${prepend}end-time`, end);
}

function createBox(col, entry, view, color) {
  const baseClass = identifiers.boxClasses[view].base;
  const attrPrepend = identifiers.boxAttributes[view].prepend;
  const attrPrependTwo = identifiers.boxAttributes[view].prependtwo;
  const coord = entry.coordinates;

  const box = document.createElement('div');
  box.classList.add(baseClass);
  box.style.backgroundColor = color;
  box.style.top = `${+coord.y * 12.5}px`;
  box.style.height = `${+coord.h * 12.5}px`;
  box.style.left = 'calc((100% - 0px) * 0 + 0px)';
  box.style.width = "calc((100% - 4px) * 1)";

  const boxheader = document.createElement('div');
  boxheader.classList.add(`${baseClass}__header`);
  const entryTitle = document.createElement('div');
  entryTitle.classList.add(`${baseClass}-title`);
  entryTitle.textContent = entry.title;
  boxheader.appendChild(entryTitle);

  const boxcontent = document.createElement('div');
  boxcontent.classList.add(`${baseClass}__content`);
  const entryTime = document.createElement('span');
  entryTime.classList.add(`${baseClass}-time`);
  boxcontent.appendChild(entryTime);

  const resizehandleS = document.createElement('div');
  resizehandleS.classList.add(`${baseClass}-resize-s`);

  if (col.getAttribute(`${attrPrependTwo}top`) === "true") {
    box.setAttribute(`${attrPrependTwo}start`, coord.x);
    box.setAttribute(`${attrPrependTwo}end`, coord.x2);
  } else {
    box.setAttribute(`${attrPrepend}start-time`, coord.y);
    box.setAttribute(`${attrPrepend}time-intervals`, coord.h);
    box.setAttribute(`${attrPrepend}end-time`, +coord.y + +coord.h);
    box.setAttribute("data-box-col", coord.x);
    box.setAttribute("box-idx", 1);
    entryTime.textContent = calcTime(coord.y, +coord.h);
  }

  box.setAttribute(`${attrPrepend}box-id`, entry.id);
  box.setAttribute(`${attrPrepend}box-category`, entry.category);
  box.append(boxheader, boxcontent, resizehandleS);
  col.appendChild(box);
}

function createTemporaryBox(box, col, hasSibling, view) {
  const clone = box.cloneNode(true);
  clone.classList.add(`${identifiers.boxClasses[view].temporary}`);
  if (hasSibling) {
    col.insertBefore(clone, box.nextElementSibling);
  } else {
    col.appendChild(clone);
  }
}

function getBoxDefaultStyle(y, backgroundColor) {
  const style = identifiers.styles.newBox;
  return `top:${y}px; left:${style.left}; height:${style.height}; width:${style.width}; background-color:${backgroundColor};`;
}

function resetStyleOnClick(view, box) {
  box.setAttribute("class", identifiers.boxClasses[view].base);
  box.style.left = 'calc((100% - 0px) * 0 + 0px)';
  box.style.width = "calc((100% - 4px) * 1)";
}

function createTempBoxHeader(view) {
  const baseClass = identifiers.boxClasses[view].base;
  const boxheader = document.createElement('div');
  const boxtitle = document.createElement('div');
  boxheader.classList.add(`${baseClass}__header`);
  boxtitle.classList.add(`${baseClass}-title`);
  boxtitle.textContent = "(no title)";
  boxheader.appendChild(boxtitle);
  return boxheader;
}

function startEndDefault(y) {
  let tempstarthour = Math.floor((y / 12.5) / 4);
  let tempstartmin = Math.floor((y / 12.5) % 4) * 15;
  return [
    tempstarthour,        // start hour
    tempstartmin,         // start minute
    tempstarthour,        // end hour
    +tempstartmin + 15    // end minute
  ];
}

function calcNewHourFromCoords(h, y) {
  return Math.floor(((h + y) / 12.5) / 4);
}

function calcNewMinuteFromCoords(h, y) {
  return Math.floor(((h + y) / 12.5) % 4) * 15;
}

function calcDateOnClick(date, start, length) {
  let [startDate, endDate] = [new Date(date), new Date(date)];
  startDate.setHours(Math.floor(+start / 4));
  startDate.setMinutes((+start * 15) % 60);
  endDate.setHours(Math.floor((start + length) / 4));
  endDate.setMinutes(((start + length) * 15) % 60);
  return [startDate, endDate];
}

function getOriginalBoxObject(box) {
  return {
    height: box.style.height,
    left: box.style.left,
    width: box.style.width,
    class: box.getAttribute("class"),
  };
}

function resetOriginalBox(box, boxorig) {
  box.setAttribute("class", boxorig.class);
  box.style.left = boxorig.left;
  box.style.width = boxorig.width;
}

/* ******************************************* */
function createFakeEntries(weekArray) {
  const randomInt = (n) => Math.floor(Math.random() * n);
  const minutes = [0, 15, 30, 45];
  let newEntries = [];

  for (let i = 0; i < 8; i++) {
    const newStart = new Date(weekArray[randomInt(7)]);
    const startHour = randomInt(6) + 1;
    newStart.setHours(startHour);
    newStart.setMinutes(minutes[randomInt(4)]);

    const newEnd = new Date(newStart);
    newEnd.setHours((+newStart.getHours() + randomInt(6)) + 2);
    newEnd.setMinutes(+newEnd.getMinutes() + minutes[randomInt(4)]);

    newEntries.push(new Entry(
      "default", false, "desc", newEnd, newStart, "event"
    ));
  }
  return newEntries;
}

/* ******************************************* */
// init classes
const context = new Context();
const weekArray = context.getWeekArray();
const store = new Store(createFakeEntries(weekArray));


const header = $('.header');
const main = $('.main');
const week = $('.week-grid');
const weekSide = $('.week-grid--side');
const weekMain = $('.week-grid--main');
const weekCol = $$('.week--col');

let entries = store.getWeekEntries(weekArray);
let boxes = new Week(entries);
let firstY = null;

function toggleTheme() {
  const moonicon = $('.moon-icon');
  const sunicon = $('.sun-icon');
  if (moonicon.classList.contains("hide-theme-icon")) {
    sunicon.classList.add("hide-theme-icon");
    moonicon.classList.remove("hide-theme-icon");
    document.body.setAttribute("class", "body theme__dark");
  } else {
    sunicon.classList.remove("hide-theme-icon");
    moonicon.classList.add("hide-theme-icon");
    document.body.setAttribute("class", "body theme__light");
  }
}

function resetStore() {
  const newEntries = createFakeEntries(weekArray);
  store.setNewStore(newEntries);
  entries = store.getWeekEntries(weekArray);
  boxes = new Week(entries);
  initGrid();
}

function createSideCells() {
  for (let i = 0; i < 24; i++) {
    const sidecell = document.createElement("span");
    sidecell.classList.add("side-cell");
    sidecell.textContent =
      i === 0 ? ""
        : i < 12 ? `${i}am`
          : i === 12 ? '12pm'
            : `${i - 12}pm`;
    weekSide.appendChild(sidecell);
  }
}

function getcol(idx) {
  return $(`[data-column-index="${idx}"]`);
}

function resetWeek() {
  weekCol.forEach((col) => col.innerText = "");
}

function renderWeek() {
  resetWeek();
  boxes.getBoxes().forEach((entry) => {
    const y = entry.coordinates.y;
    firstY == null || y < firstY ? (firstY = y) : null;
    const col = weekCol[+entry.coordinates.x];
    createBox(col, entry, "week", "#2C52BA");
  });
}

/* ******************************************* */
// EVENT DRAG/RESIZE/CREATION LOGIC
function dragEngineWeek(e, box) {
  setStylingForEvent("dragstart");
  const col = box.parentElement;
  let currentColumn = col.getAttribute("data-column-index");
  let boxhasOnTop = false;
  box.setAttribute("data-box-col", currentColumn);
  const headerOffset = weekMain.offsetTop;
  const startTop = +box.style.top.split("px")[0];
  const boxHeight = +box.style.height.split("px")[0];
  let startCursorY = e.pageY - weekMain.offsetTop;
  let startCursorX = e.pageX;
  let tempstartY = e.pageY;
  let [sX, sY] = [0, 0];
  let hasStyles = false;

  const mousemove = (e) => {
    sX = Math.abs(e.clientX - startCursorX);
    sY = Math.abs(e.clientY - tempstartY);
    // only update style if dragging occurs
    if (!hasStyles) {
      if (sX > 3 || sY > 3) {
        hasStyles = true;
        document.body.style.cursor = "move";
        if (box.classList.contains("box-ontop")) {
          boxhasOnTop = true;
          resetStyleOnClick("week", box);
        }
        box.classList.add("box-dragging");
        createTemporaryBox(box, col, boxhasOnTop, "week");
        sX = 0;
        sY = 0;
      }
    }

    const currentCursorY = e.pageY - headerOffset;
    let newOffsetY = currentCursorY - startCursorY;
    let newTop = Math.round((newOffsetY + startTop) / 12.5) * 12.5;

    if (newTop < 0 || currentCursorY < 0) {
      newTop = 0;
      return;
    } else if (newTop + boxHeight > 1188) {
      return;
    }

    box.style.top = `${newTop}px`;
    /** DRAG EAST/WEST */
    // determine whether user switches columns and update left/rightColX to new column when necessary
    const direction = e.pageX - startCursorX > 0 ? "right" : "left";
    let leftColX;
    let rightColX;

    if (+currentColumn - 1 >= 0) {
      leftColX = parseInt(getcol(currentColumn - 1).getBoundingClientRect().right);
    } else {
      leftColX = null;
    }

    if (+currentColumn + 1 < weekCol.length) {
      rightColX = parseInt(getcol(+currentColumn + 1).getBoundingClientRect().left);
    } else {
      rightColX = null;
    }

    if (direction === "right" && rightColX !== null) {
      if (e.pageX >= rightColX) {
        getcol(+currentColumn + 1).appendChild(box);
        startCursorX = e.pageX;
        currentColumn = +currentColumn + 1;
        box.setAttribute("data-box-col", +currentColumn);
      }
    }

    if (direction === "left" && leftColX !== null) {
      if (e.pageX <= leftColX) {
        getcol(+currentColumn - 1).appendChild(box);
        startCursorX = e.pageX;
        currentColumn = +currentColumn - 1;
        box.setAttribute("data-box-col", +currentColumn);
      }
    }
  };

  function mouseup() {
    const tempbox = document.querySelector(".temporary-box");
    box.classList.remove("box-dragging");
    if (boxhasOnTop) { box.classList.add("box-ontop"); }

    if (tempbox === null) {
      setStylingForEvent("dragend");
    } else {
      tempbox.remove();
      setBoxTimeAttributes(box, "week");
      const time = calcTime(
        +box.getAttribute("data-start-time"),
        +box.getAttribute("data-time-intervals")
      );

      box.setAttribute("data-time", time);
      box.children[1].children[0].textContent = time;

      updateBoxCoordinates(box, "week", boxes);
      boxes.updateStore(
        store,
        box.getAttribute("data-box-id"),
        weekArray
      );

      // check if new position overlaps with other boxes and handle
      let droppedCol = +box.getAttribute("data-box-col");
      if (boxes.getBoxesByColumn(droppedCol).length > 1) {
        handleOverlap(droppedCol, "week", boxes);
      } else {
        box.setAttribute("box-idx", "box-one");
      }
      setStylingForEvent("dragend");
    }

    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  }
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("mouseup", mouseup);
}

function resizeBoxNS(e, box) {
  setStylingForEvent("dragstart");
  document.body.style.cursor = "move";

  const col = box.parentElement;
  const currentColumn = col.getAttribute("data-column-index");
  box.setAttribute("data-box-col", currentColumn);

  let boxhasOnTop = false;
  let boxorig = getOriginalBoxObject(box);
  if (box.classList.contains("box-ontop")) {
    boxhasOnTop = true;
    resetStyleOnClick("week", box);
  }

  box.classList.add("box-resizing");
  const boxTop = box.offsetTop;
  createTemporaryBox(box, col, boxhasOnTop, "week");

  const mousemove = (e) => {
    const headerOffset = weekMain.offsetTop;
    let amountScrolled = Math.abs(parseInt(weekMain.getBoundingClientRect().top));
    if (amountScrolled == headerOffset) {
      amountScrolled -= headerOffset;
    } else if (weekMain.getBoundingClientRect().top > 0) {
      amountScrolled = headerOffset - amountScrolled;
    } else {
      amountScrolled += headerOffset;
    }

    const newHeight = Math.round(((e.pageY - boxTop - headerOffset) + amountScrolled) / 12.5) * 12.5;

    if (newHeight <= 12.5) {
      box.style.height = '12.5px';
      return;
    } else if (newHeight + parseInt(box.style.top) > 1188) {
      return;
    } else {
      box.style.height = `${newHeight}px`;
    }
  };

  const mouseup = (e) => {
    $(".temporary-box").remove();
    box.classList.remove("box-resizing");
    if (boxhasOnTop) { box.classList.add("box-ontop"); }

    if (box.style.height === boxorig.height) {
      if (boxhasOnTop) {
        box.setAttribute("class", boxorig.class);
        box.style.left = boxorig.left;
        box.style.width = boxorig.width;
      }
    } else {
      setBoxTimeAttributes(box, "week");
      const start = +box.getAttribute("data-start-time");
      const length = +box.getAttribute("data-time-intervals");
      const time = calcTime(start, length);
      box.children[1].children[0].textContent = time;
      updateBoxCoordinates(box, "week", boxes);

      let droppedCol = +box.getAttribute("data-box-col");
      if (boxes.getBoxesByColumn(droppedCol).length > 1) {
        handleOverlap(droppedCol, "week", boxes);
      }

      boxes.updateStore(
        store,
        box.getAttribute("data-box-id"),
        weekArray,
      );
    }

    setStylingForEvent("dragend");
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("mouseup", mouseup);
}

function createBoxOnDrag(e) {
  setStylingForEvent("dragstart", main, store);
  document.body.style.cursor = "move";
  const color = '#2C52BA';
  const colIdx = parseInt(e.target.getAttribute("data-column-index"));

  const box = document.createElement('div');
  box.setAttribute("class", "box box-dragging temp-week-box");
  let day = weekArray[+colIdx];

  const boxheader = createTempBoxHeader("week");
  const boxcontent = document.createElement('div');
  const boxtime = document.createElement('span');
  const boxtimeend = document.createElement('span');
  boxcontent.classList.add('box__content');
  boxtime.classList.add('box-time');
  boxtimeend.classList.add('box-time');

  const headerOffset = +weekMain.offsetTop;
  const scrolled = parseInt(week.scrollTop);
  const startCursorY = e.pageY - weekMain.offsetTop;

  let y = Math.round((startCursorY + Math.abs(scrolled)) / 12.5) * 12.5;
  box.setAttribute("style", getBoxDefaultStyle(y, color));

  let coords = { y: +y / 12.5, x: colIdx, h: 1, e: 2 };
  let [starthour, startmin, endhour, endmin] = startEndDefault(y);

  function mousemove(e) {
    const currentCursorY = e.pageY - headerOffset;
    let newOffsetY = currentCursorY - startCursorY;
    let newHeight = Math.round((newOffsetY) / 12.5) * 12.5;

    if (newHeight <= 12.5) { newHeight = 12.5; }
    if (newHeight + y > 1188) { newHeight = 1187.5 - y; }
    box.style.height = `${newHeight}px`;

    coords.h = +newHeight / 12.5;
    coords.e = +coords.y + coords.h;

    endhour = Math.floor(((+newHeight + +y) / 12.5) / 4);
    endmin = Math.floor(((+newHeight + +y) / 12.5) % 4) * 15;
    boxtime.style.wordBreak = "break-word";
    boxtime.textContent = `${formatTime(starthour, startmin)} – `;
    boxtimeend.textContent = `${formatTime(endhour, endmin)}`;
  }

  boxcontent.append(boxtime, boxtimeend);
  box.append(boxheader, boxcontent);
  e.target.appendChild(box);

  function mouseup() {
    setStylingForEvent("dragend");
    let [tempstart, tempend] = [new Date(day), new Date(day)];
    tempstart.setHours(starthour);
    tempstart.setMinutes(startmin);
    tempend.setHours(endhour);
    tempend.setMinutes(endmin);
    store.addEntry(new Entry(
      'default',
      false,
      'random description',
      tempend,
      tempstart,
      'new event'
    ));
    entries = store.getWeekEntries(weekArray);
    boxes = new Week(entries);
    initGrid();
    document.removeEventListener("mouseup", mouseup);
    document.removeEventListener("mousemove", mousemove);
  }
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("mouseup", mouseup);
}

/* ******************************************* */
// DELEGATE EVENTS via ".week-grid"
function delegateGrid(e) {
  const getBoxResizeHandle = e.target.closest(".box-resize-s");
  const getBox = e.target.closest('.box');
  const getWeekCol = e.target.closest('.week--col');

  if (getBoxResizeHandle) {
    resizeBoxNS(e, e.target.parentElement);
    return;
  }

  if (getBox) {
    dragEngineWeek(e, e.target);
    return;
  }

  if (getWeekCol) {
    createBoxOnDrag(e, e.target);
    return;
  }
}

/* ******************************************* */
// create fake entries, render entries to grid, check for overlapping entries & handle
function initGrid() {
  renderWeek();
  const checkCols = boxes.getColumnsWithMultipleBoxes();
  checkCols.forEach(col => handleOverlap(col, "week", boxes));
};

function initApp() {
  createSideCells();
  initGrid();
  $('.reload--btn').onclick = resetStore;
  $('.toggle-theme--btn').onclick = toggleTheme;
  week.onmousedown = delegateGrid;
}

initApp();
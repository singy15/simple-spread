import {
  ref,
  reactive,
  nextTick,
} from "https://cdn.jsdelivr.net/npm/vue@3.2/dist/vue.esm-browser.js";

const Spread = {
  setup() {
    const setStorage = (key, val) => {
      try {
        localStorage.setItem(`spread/${key}`, JSON.stringify(val));
      } catch (e) {
        // noop
      }
    };

    const getStorage = (key, defaultVal) => {
      try {
        return localStorage.getItem(`spread/${key}`)
          ? JSON.parse(localStorage.getItem(`spread/${key}`))
          : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    };

    const data = reactive(
      getStorage("data", {
        0: {
          0: { value: "r0c0" },
          //1: { value: "r0c1" },
          2: { value: "r0c2" },
        },
        1: {
          0: { value: "r1c0" },
          1: { value: "r1c1" },
          2: { value: "r1c2" },
        },
        2: {
          0: { value: "r2c0" },
          1: { value: "r2c1" },
          2: { value: "r2c2" },
        },
      }),
    );
    const columns = ref(getStorage("columns", 20));
    const rows = ref(getStorage("rows", 50));
    const defaultWidth = 100;
    const defaultHeight = 20;
    const widths = reactive(
      getStorage("windths", {
        0: defaultWidth,
        1: defaultWidth,
        2: defaultWidth,
      }),
    );
    const heights = reactive(
      getStorage("heights", {
        0: defaultHeight,
        1: defaultHeight,
        2: defaultHeight,
      }),
    );
    const fromRow = ref(-1);
    const fromColumn = ref(-1);
    const selectRow = ref(0);
    const selectColumn = ref(0);
    const overRow = ref(0);
    const overColumn = ref(0);
    const editing = ref(false);
    const beforeValue = ref(null);

    const getv = (r, c) =>
      data[r] && data[r][c] ? data[r][c].value : undefined;

    const setv = (r, c, v) => {
      if (!data[r]) data[r] = {};
      data[r][c] = { value: v };
    };

    const existCell = (r, c) => {
      return data[r] && data[r][c];
    };

    const cellStyle = (r, c) => {
      let style = {};
      style.width = `${widths[c] ?? defaultWidth}px`;
      style.height = `${heights[r] ?? defaultHeight}px`;
      if (r < 0 || c < 0) {
        style.backgroundColor = "#DDD";
      }
      if (c < 0) {
        style.position = "sticky";
        style.left = 0;
        style.zIndex = 9000;
      }
      if (r < 0) {
        style.position = "sticky";
        style.top = 0;
        style.zIndex = 9001;
      }
      if (r < 0 && c < 0) {
        style.zIndex = 9003;
      }
      // if (r === selectRow.value && c === selectColumn.value) {
      //   style.border = "solid 2px #4b89ff";
      //   style.padding = "0px";
      // }
      return style;
    };

    const cellClass = (r, c) => {
      let cls = ["box", "cell"];
      if (r === selectRow.value && c === selectColumn.value) {
        cls.push("select");
      }

      let xrng = [selectRow.value, fromRow.value].sort();
      let yrng = [selectColumn.value, fromColumn.value].sort();
      if (r >= xrng[0] && r <= xrng[1] && c >= yrng[0] && c <= yrng[1]) {
        cls.push("in-range");
      }
      return cls;
    };

    const cellClick = (r, c) => {
      if (selectRow.value !== r || selectColumn.value !== c) {
        commitEdit();
      }
      selectRow.value = r;
      selectColumn.value = c;
      fromRow.value = r;
      fromColumn.value = c;
    };

    const cellOver = (r, c) => {
      overRow.value = r;
      overColumn.value = c;
    };

    const editorAppear = (r, c) => {
      return (
        (selectRow.value === r && selectColumn.value === c) ||
        (overRow.value === r && overColumn.value === c)
      );
    };

    const beginEdit = (clear = false) => {
      if (clear && existCell(selectRow.value, selectColumn.value)) {
        data[selectRow.value][selectColumn.value].value = "";
      }
      editing.value = true;
    };

    const commitEdit = () => {
      editing.value = false;
    };

    const rollbackEdit = () => {
      editing.value = false;
    };

    const cellMousedown = (r, c, event) => {
      if (event.detail === 2 && !editing.value) {
        beginEdit();
        event.preventDefault();
      }
    };

    const textareaClass = (r, c) => {
      let cls = [];
      if (selectRow.value === r && selectColumn.value === c && editing.value) {
        cls.push("edit");
      }
      return cls;
    };

    const moveCursor = async (dx, dy, shift) => {
      if (selectRow.value + dx < 0) {
        selectRow.value = 0;
      } else if (selectRow.value + dx >= rows.value) {
        selectRow.value = rows.value - 1;
      } else {
        selectRow.value = selectRow.value + dx;
      }
      if (selectColumn.value + dy < 0) {
        selectColumn.value = 0;
      } else if (selectColumn.value + dy >= columns.value) {
        selectColumn.value = columns.value - 1;
      } else {
        selectColumn.value = selectColumn.value + dy;
      }

      if (!shift) {
        fromRow.value = selectRow.value;
        fromColumn.value = selectColumn.value;
      }

      await nextTick();

      let ta = document.querySelector(
        `#ta-${selectRow.value}-${selectColumn.value}`,
      );
      ta.focus();
    };

    const cellKeydown = (r, c, event) => {
      // // console.log(event);
      if (editing.value) {
        if (event.isComposing === false && event.keyCode === /*esc*/ 27) {
          rollbackEdit();
          event.preventDefault();
          return;
        }
        if (
          event.isComposing === false &&
          event.keyCode === 13 &&
          event.shiftKey === false &&
          event.ctrlKey === false
        ) {
          event.preventDefault();
          commitEdit();
          moveCursor(1, 0, false);
          return;
        } else if (
          event.isComposing === false &&
          event.keyCode === 13 &&
          event.shiftKey === false &&
          event.ctrlKey === true
        ) {
          event.preventDefault();
          commitEdit();
          //this.selection().map((x) => {
          //  this.data[x.row][x.col] = this.data[this.row][this.col];
          //});
          return;
        } else if (event.keyCode === 9 && event.shiftKey === false) {
          event.preventDefault();
          commitEdit();
          moveCursor(0, 1, false);
          return;
        } else if (
          event.isComposing === false &&
          event.keyCode === 13 &&
          event.shiftKey === true &&
          event.ctrlKey === false
        ) {
          // // let area = event.target;
          // // let text = event.target.value;
          // // let origSelectionStart = area.selectionStart;
          // // let origSelectionEnd = area.selectionEnd;
          // // this.data[irow][icol] = area.value.substr(0, area.selectionStart) + "\r\n" + area.value.substr(area.selectionStart);
          // // // area.value = area.value.substr(0, area.selectionStart) + "\r\n" + area.value.substr(area.selectionStart);
          // // area.selectionStart = origSelectionStart;
          // // area.selectionEnd = origSelectionEnd;
          // // event.preventDefault();
        }
        return;
      } else {
        if (
          [9, 13, 37, 38, 39, 40, 16, 17, 113].indexOf(event.keyCode) === -1 &&
          event.ctrlKey === false &&
          event.altKey === false
        ) {
          beginEdit(true);
          return;
        }
        if (event.keyCode === 113) {
          beginEdit();
          return;
        }
        if (event.keyCode === 37) {
          moveCursor(0, -1, event.shiftKey);
        }
        if (event.keyCode === 38) {
          moveCursor(-1, 0, event.shiftKey);
        }
        if (event.keyCode === 39) {
          moveCursor(0, 1, event.shiftKey);
        }
        if (event.keyCode === 40) {
          moveCursor(1, 0, event.shiftKey);
        }
        // if (
        //   event.keyCode === 13 &&
        //   event.shiftKey === false &&
        //   event.ctrlKey === false &&
        //   this.row === this.countRows - 1
        // ) {
        //   this._appendRow();
        //   this.emitDatachanged();
        // }
        if (
          event.keyCode === 13 &&
          event.shiftKey === false &&
          event.ctrlKey === false
        ) {
          moveCursor(1, 0, false);
        }
        if (
          event.keyCode === 9 &&
          event.shiftKey === false &&
          event.ctrlKey === false
        ) {
          moveCursor(0, 1, false);
        }
        // Copy : Ctrl + C
        if (event.keyCode === 67 && event.ctrlKey === true) {
          // this.clipboard = true;
          // this.clipboardContents = this.selectionData();
        }
        // Cut : Ctrl + X
        if (event.keyCode === 88 && event.ctrlKey === true) {
          // this.clipboard = true;
          // this.clipboardContents = this.selectionData();
          // this.selection().map((x) => {
          //   this.setValue(x.row, x.col, null);
          // });
          // this.emitDatachanged();
        }
        // Paste : Ctrl + V
        if (event.keyCode === 86 && event.ctrlKey === true && this.clipboard) {
          // let d = this.clipboardContents;
          // if (d.length === 1 && d[0].length === 1) {
          //   this.selection().map((x) => {
          //     this.setValue(x.row, x.col, d[0][0]);
          //   });
          //   this.emitDatachanged();
          // } else {
          //   for (let r = 0; r < d.length; r++) {
          //     for (let c = 0; c < d[r].length; c++) {
          //       this.setValue(this.row + r, this.col + c, d[r][c]);
          //     }
          //   }
          //   this.emitDatachanged();
          // }
        }
        // Start editing
        if (event.keyCode === 13 && event.shiftKey === true) {
          // event.preventDefault();
          // this.startEdit(this.row, this.col);
          return;
        }
        event.preventDefault();
      }
    };

    const dragstart = reactive({
      row: null,
      col: null,
      screenX: null,
      screenY: null,
    });

    const dragend = reactive({
      row: null,
      col: null,
      screenX: null,
      screenY: null,
    });

    const eventDragstartVert = (irow, icol, event) => {
      dragstart.row = irow;
      dragstart.col = icol;
      dragstart.screenX = event.screenX;
      dragstart.screenY = event.screenY;
    };

    const eventDragVert = (irow, icol, event) => {};

    const eventDragendVert = (irow, icol, event) => {
      dragend.row = irow;
      dragend.col = icol;
      dragend.screenX = event.screenX;
      dragend.screenY = event.screenY;
      let diffX = dragend.screenX - dragstart.screenX;
      //this.getDef(-1, icol).width = this.getDef(-1, icol).width + diffX;
      if (!widths[icol]) widths[icol] = defaultWidth;
      widths[icol] = widths[icol] + diffX;
    };

    const eventDragstartHori = (irow, icol, event) => {
      dragstart.row = irow;
      dragstart.col = icol;
      dragstart.screenX = event.screenX;
      dragstart.screenY = event.screenY;
    };

    const eventDragHori = (irow, icol, event) => {};

    const eventDragendHori = (irow, icol, event) => {
      dragend.row = irow;
      dragend.col = icol;
      dragend.screenX = event.screenX;
      dragend.screenY = event.screenY;
      let diffY = dragend.screenY - dragstart.screenY;
      //this.getDef(irow, -1).height = this.getDef(irow, -1).height + diffY;
      if (!heights[irow]) heights[irow] = defaultHeight;
      heights[irow] = heights[irow] + diffY;
    };

    return {
      data,
      columns,
      rows,
      widths,
      heights,
      getv,
      setv,
      cellStyle,
      cellClass,
      cellClick,
      cellOver,
      selectRow,
      selectColumn,
      overRow,
      overColumn,
      editing,
      editorAppear,
      cellMousedown,
      textareaClass,
      cellKeydown,
      eventDragstartHori,
      eventDragHori,
      eventDragendHori,
      eventDragstartVert,
      eventDragVert,
      eventDragendVert,
    };
  },

  template: `
    <div class="box-container">
      <!-- top left header -->
      <div class="box cell" :style="cellStyle(-1,-1)">
        {{ getv(-1,-1) }}
      </div>

      <!-- column header -->
      <template v-for="(j,c) in rows">
          <div class="box cell" :style="cellStyle(-1,c)">
            {{ getv(-1,c) }}
            <span style="display:inline-block; position:absolute; 
                right:0px; top:0px; width:5px; background-color:transparent;
                cursor:col-resize;"
                  :style="{height:cellStyle(-1,c).height}"
                draggable="true"
                @drag="eventDragVert(-1,c,$event)"
                @dragstart="eventDragstartVert(-1,c,$event)"
                @dragend="eventDragendVert(-1,c,$event)"
                ></span>
          </div>
      </template>
      <br/>
      
      <template v-for="(i,r) in rows">
        <!-- row header -->
        <div class="box cell" :style="cellStyle(r,-1)">
            {{ getv(r,-1) }} 
            <span style="display:inline-block; position:absolute;
                left:0px; bottom:0px; height:5px; background-color:transparent;
                cursor:row-resize;"
                  :style="{width:cellStyle(r,-1).width}"
                draggable="true"
                @drag="eventDragHori(r,-1,$event)"
                @dragstart="eventDragstartHori(r,-1,$event)"
                @dragend="eventDragendHori(r,-1,$event)"
                ></span>
        </div>

        <!-- data cell -->
        <template v-for="(j,c) in columns">
          <div class="box cell" :style="cellStyle(r,c)" :class="cellClass(r,c)"
            @click="cellClick(r,c)"
            @mouseover="cellOver(r,c)">
            
              <!--:readonly="!editing"-->
            <textarea v-if="editorAppear(r,c)"
              :value="getv(r,c)" 
              :id="'ta-' + r.toString() + '-' + c.toString()"
              @input="setv(r,c,$event.target.value)" 
              :style="cellStyle(r,c)"
              :class="textareaClass(r,c)"
              @mousedown="cellMousedown(r,c,$event)"
              @keydown="cellKeydown(r,c,$event)"
              spellcheck="false"></textarea>  
            <span class="cell-text" v-if="!editorAppear(r,c) && getv(r,c)">{{ getv(r,c) }}</span>
          </div>
        </template>

        <br/>
      </template> 
    </div>
  `,
};

export default {
  Spread,
};

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
    const columns = ref(getStorage("columns", 3));
    const rows = ref(getStorage("rows", 3));
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
      style.width = c > 0 ? `${widths[c]}px` : `${defaultWidth}px`;
      style.height = r > 0 ? `${heights[r]}px` : `${defaultHeight}px`;
      if (r < 0 || c < 0) {
        style.backgroundColor = "#DDD";
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
      return cls;
    };

    const cellClick = (r, c) => {
      if (selectRow.value !== r || selectColumn.value !== c) {
        commitEdit();
      }
      selectRow.value = r;
      selectColumn.value = c;
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
          [9, 13, 37, 38, 39, 40, 16, 17].indexOf(event.keyCode) === -1 &&
          event.ctrlKey === false &&
          event.altKey === false
        ) {
          beginEdit(true);
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
          </div>
      </template>
      <br/>
      
      <template v-for="(i,r) in columns">
        <!-- row header -->
        <div class="box cell" :style="cellStyle(r,-1)">
            {{ getv(r,-1) }} 
        </div>

        <!-- data cell -->
        <template v-for="(j,c) in rows">
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

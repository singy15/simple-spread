// @@@webenv.script(main)

import { createApp } from "https://cdn.jsdelivr.net/npm/vue@3.2/dist/vue.esm-browser.js";
import spread from "./spread.js";

createApp({
  components: {
    spread: spread.Spread,
  },
  data() {
    return {
      name: "world",
    };
  },
}).mount("#app");

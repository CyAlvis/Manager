// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import router from "./router";
import VueSocketIO from "vue-socket.io";
import VueContextMenu from "vue-context-menu";
import VueChartkick from 'vue-chartkick';
import Chart from 'chart.js';
 
Vue.use(VueChartkick, {adapter: Chart})
Vue.config.productionTip = false;
Vue.use(VueSocketIO, "http://localhost:3010");
Vue.use(VueContextMenu);

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>"
});

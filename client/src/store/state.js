import { makeAutoObservable } from "mobx";

class State {
  login;
  constructor() {
    makeAutoObservable(this);
  }
  is_login(bool) {
    login = bool;
  }

  get_is_login() {
    return login;
  }
}

export default new State();

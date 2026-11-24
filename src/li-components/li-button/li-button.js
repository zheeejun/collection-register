(function () {
  'use strict';

  class LiButton extends HTMLElement {
    static get observedAttributes() { return ['disabled']; }

    constructor() {
      super();
      this.addEventListener('click', function (event) {
        if (this.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
      this.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!this.disabled && !event.repeat && event.key === 'Enter') this.click();
      });
      this.addEventListener('keyup', function (event) {
        if (event.key !== ' ') return;
        event.preventDefault();
        if (!this.disabled) this.click();
      });
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
      if (this._enabledTabIndex === undefined) {
        this._enabledTabIndex = this.hasAttribute('tabindex') ? this.tabIndex : 0;
      }
      this.updateDisabled();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.updateDisabled();
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

    updateDisabled() {
      this.setAttribute('aria-disabled', String(this.disabled));
      this.tabIndex = this.disabled ? -1 : this._enabledTabIndex;
    }
  }

  customElements.define('li-button', LiButton);
}());

import { $ } from '../lib/dom';

export type Toast = (msg: string) => void;

export function createToast(): Toast {
  const toastEl = $('toast');
  let toastTimer: number | undefined;
  return (msg) => {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toastEl.classList.remove('on'); }, 3200);
  };
}

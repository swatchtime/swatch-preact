import { useEffect } from 'preact/hooks';

export default function useBootstrapModal(modalRef) {
  // Returns simple helpers to show/hide a Bootstrap modal referenced by modalRef
  const getInstance = () => {
    if (!modalRef || !modalRef.current) return null;
    if (typeof bootstrap === 'undefined') return null;
    return bootstrap.Modal.getOrCreateInstance(modalRef.current);
  };

  const show = () => {
    const inst = getInstance();
    if (inst) inst.show();
  };

  const hide = () => {
    const inst = getInstance();
    if (inst) inst.hide();
  };

  // Ensure the DOM element has the proper tabindex/aria when mounted (no-op here but reserved)
  useEffect(() => {
    return () => {};
  }, [modalRef]);

  return { show, hide, getInstance };
}

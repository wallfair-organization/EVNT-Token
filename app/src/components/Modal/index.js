const Modal = ({ isOpen, onDismiss = null, minHeight = false, maxHeight = 90, children }) => {
  if (!isOpen) return null;
  return (
    <div className="ModalWrapper">
      <div className="ModalContent">{children}</div>
      <div className="ModalBG" onClick={onDismiss} />
    </div>
  );
};

export default Modal;

import React, { useState } from "react";
import ReportModal from "../pages/ReportModal";

function ReportButton({ targetType, targetId }) {
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      <button type="button" onClick={handleOpen}>
        신고
      </button>

      {showModal && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          onClose={handleClose}
        />
      )}
    </>
  );
}

export default ReportButton;

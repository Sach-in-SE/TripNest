import CollaboratorModal from "./CollaboratorModal";

/**
 * ShareTripModal has been unified and superseded by CollaboratorModal.
 * This facade remains for backward-compatibility with any existing references.
 */
const ShareTripModal = (props) => {
  return <CollaboratorModal {...props} />;
};

export default ShareTripModal;
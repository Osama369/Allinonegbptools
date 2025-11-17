import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import Modal from "../Components/Modal.jsx";
import { useModal } from "../Contexts/ModelContext.jsx";

export default function MainLayout() {
  const { showModal, closeModal } = useModal();

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />

      {showModal && (
        <Modal
          title="Join Us Today!"
          description="Register now to access exclusive features."
          onClose={closeModal}
        />
      )}
    </>
  );
}

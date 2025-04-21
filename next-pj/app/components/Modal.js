function openModal() {
    document.getElementById('popupModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('popupModal').classList.add('hidden');
  }


  function FileUpload() {
    const [fileName, setFileName] = useState(null);

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setFileName(file.name);
      } else {
        setFileName(null);
      }
    }
  }
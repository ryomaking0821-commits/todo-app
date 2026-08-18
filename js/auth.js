const Auth = (() => {
  function showLoggedOut() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("app-shell").style.display = "none";
  }

  function showLoggedIn(user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-shell").style.display = "";
    document.getElementById("user-name").textContent = user.displayName || user.email || "";
  }

  function init() {
    const { auth, googleProvider, onAuthStateChanged, signInWithPopup, signOut } = window.Firebase;

    document.getElementById("login-btn").addEventListener("click", () => {
      signInWithPopup(auth, googleProvider).catch((err) => {
        alert("ログインに失敗しました: " + err.message);
      });
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      signOut(auth);
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        showLoggedIn(user);
        Store.startSync(user.uid, App.refresh);
      } else {
        Store.stopSync();
        showLoggedOut();
      }
    });
  }

  return { init };
})();

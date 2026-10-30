document.addEventListener('DOMContentLoaded', () => {
    const pageWrapper = document.getElementById('pageWrapper');
    const triggerButton = document.getElementById('triggerSignup');
    const loginTab = document.getElementById('loginTab');
    const hectareaButton = document.getElementById('hectarea');

    if (!pageWrapper || !triggerButton || !loginTab) return;

   
    triggerButton.addEventListener('click', () => {
        pageWrapper.classList.add('expanded');

       
    });

   
    loginTab.addEventListener('click', () => {
        pageWrapper.classList.remove('expanded');

       
    });
});
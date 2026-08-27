// 글쓰기/수정 폼 열기·닫기 토글
function toggleForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.classList.toggle("hidden");
}

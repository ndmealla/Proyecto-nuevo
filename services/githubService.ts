
export const syncRecordsToGitHub = async (records: any[]) => {
  const token = localStorage.getItem('gh_token');
  const repo = localStorage.getItem('gh_repo');

  if (!token || !repo) {
    console.warn("GitHub Sync: Faltan credenciales (Token o Repo)");
    return false;
  }

  const fileName = 'attendance.json';
  const url = `https://api.github.com/repos/${repo}/contents/${fileName}`;
  const content = btoa(JSON.stringify(records, null, 2));

  try {
    // 1. Intentar obtener el archivo actual para conseguir el SHA (necesario para actualizar)
    let sha = "";
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Crear o Actualizar el archivo
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update attendance: ${new Date().toISOString()}`,
        content: content,
        sha: sha || undefined
      })
    });

    if (!putRes.ok) {
      const errorData = await putRes.json();
      throw new Error(errorData.message || "Error al subir a GitHub");
    }

    return true;
  } catch (error) {
    console.error("GitHub Sync Error:", error);
    return false;
  }
};

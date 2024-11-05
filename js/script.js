document.querySelector("#gerar-pdf").addEventListener("click", async () => {
  await salvarPDF();
});

async function salvarPDF() {
  const conteudo = document.querySelector("#content");
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const options = {
    margin: [10, 10, 10, 10],
    filename: `Relatório_Climático_${dataAtual}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  await html2pdf().set(options).from(conteudo).save();
}

async function estados() {
  const resp = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados`
  );
  const dados = await resp.json();
  const select = document.querySelector("#estados");
  select.innerHTML =
    '<option value="" disabled selected>Selecione um estado</option>';
  dados.map(function (obj) {
    select.innerHTML += `<option value="${obj.sigla}">${obj.nome}</option>`;
  });
}

async function cidades() {
  const estado = document.querySelector("#estados").value;
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`;
  const resp = await fetch(url);
  const dados = await resp.json();
  const select = document.querySelector("#cidades");
  select.innerHTML =
    '<option value="" disabled selected>Selecione uma cidade</option>';

  dados.map(function (obj) {
    select.innerHTML += `<option value="${obj.nome}">${obj.nome}</option>`;
  });
  select.addEventListener("change", async () => {
    const cidadeSelecionada = select.value;
    if (cidadeSelecionada) {
        setTimeout(() => {
            pegarDados(cidadeSelecionada);
          }, 200);
    }
  });
}

async function pegarDados(cidade) {
  const minhaChave = "98cfaf3e12d34b6f98a202357240411";
  const cidadeArrumada = encodeURIComponent(
    cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
  const tabela = document.querySelector("#tabela");

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${minhaChave}&q=${cidadeArrumada}&days=1&aqi=yes&alerts=yes&lang=pt`
    );
    if (!response.ok) {
      throw new Error("Erro na requisição: " + response.status);
    }
    const dados = await response.json();

    //informações de local e data
    const local = document.querySelector("#local-info");
    const data = document.querySelector("#data-info");
    const data2 = document.querySelector("#data-info2");

    // Obter a data atual
    const dataAtual = new Date();
  
    // Formatar a data no formato YYYY-MM-DD
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // getMonth() retorna 0-11
    const dia = String(dataAtual.getDate()).padStart(2, '0');
  
    // Montar a string no formato correto
    data2.value = `${ano}-${mes}-${dia}`;

    data.innerHTML = `${new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })} às ${new Date().toLocaleTimeString("pt-BR", { hour12: false })}`;

    local.innerHTML = `${cidade} - ${document.querySelector("#estados").value}`;

    //tabela
    tabela.innerHTML = ""; 
    dados.forecast.forecastday[0].hour.forEach((hour) => {
      tabela.innerHTML += `<tr>
                <td>${hour.time.slice(-5)}</td>
                <td>${hour.condition.text}</td>
                <td>${hour.chance_of_rain || 0}%</td>
                <td>${hour.temp_c}°C</td>
                <td>${hour.feelslike_c}°C</td>
                <td>${hour.humidity}%</td>
                <td>${hour.wind_kph} km/h</td>
            </tr>`;
    });
    //ar

    const qualidadeAr = dados.current.air_quality["us-epa-index"]; 
    const qualidadeStatusDiv = document.querySelector(".quality-status");

    let statusQualidade;
    let classeQualidade;

    switch (qualidadeAr) {
      case 1:
      case 2:
        statusQualidade = "Boa";
        classeQualidade = "boa"; 
        break;
      case 3:
        statusQualidade = "Moderada";
        classeQualidade = "moderada"; 
        break;
      case 4:
        statusQualidade = "Alta";
        classeQualidade = "alta";
        break;
      case 5:
      case 6:
        statusQualidade = "Muito Alta";
        classeQualidade = "muito-alta"; 
        break;
      default:
        statusQualidade = "Dados não disponíveis";
        classeQualidade = ""; 
    }

   
    qualidadeStatusDiv.textContent = statusQualidade;
    qualidadeStatusDiv.className = `quality-status ${classeQualidade}`; 

    
    document.getElementById("co-value").textContent =
      dados.current.air_quality.co.toFixed(2);
    document.getElementById("no2-value").textContent =
      dados.current.air_quality.no2.toFixed(2);
    document.getElementById("o3-value").textContent =
      dados.current.air_quality.o3.toFixed(2);
    document.getElementById("pm25-value").textContent =
      dados.current.air_quality.pm2_5.toFixed(2);
    document.getElementById("pm10-value").textContent =
      dados.current.air_quality.pm10.toFixed(2);
    document.getElementById("so2-value").textContent =
      dados.current.air_quality.so2.toFixed(2);
  } catch (error) {
    console.error("Erro ao buscar dados: ", error);
    alert("Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.");
  }
}

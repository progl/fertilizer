function calculateAcidContent() {
    const acidType = document.getElementById('acid_type').value;
    const acidConcentration = parseFloat(document.getElementById('acid_concentration').value);

    let coefficients = [];
    let molarMass = 0;
    let element;
    let elementMassPercent = 0;

    if (acidType === "HNO3") {
        coefficients = [0.998383449884377, 0.005354584271097161, 0.00001648926499569006, 7.318523893102484e-7, -2.0404258441148985e-8, 1.3375348226810532e-10, -2.1963512473317819e-13];
        molarMass = 63.01; // Молекулярная масса азотной кислоты
        element = "N";
        elementMassPercent = 22.2; // Массовая доля азота в 100%-ной азотной кислоте, в %
    } else if (acidType === "H3PO4") {
        coefficients = [0.9995511616542735, 0.0048140372474700655, 0.00006898398135572574, -0.000001919658204179223, 4.2811001909673815e-8, -4.0591265688000186e-10, 1.3967623271441886e-12];
        molarMass = 97.99; // Молекулярная масса фосфорной кислоты
        element = "P";
        elementMassPercent = 31.6; // Массовая доля фосфора в 100%-ной фосфорной кислоте, в %
    } else if (acidType === "H2SO4") {
        coefficients = [0.9998005849923441, 0.0060213632614753085, 0.00006771487955713109, -0.0000010715518793648023, 1.612772542114926e-9, 2.644747009948988e-10, -2.185198888487415e-12];
        molarMass = 98.08; // Молекулярная масса серной кислоты
        element = "S";
        elementMassPercent = 32.7; // Массовая доля серы в 100%-ной серной кислоте, в %
    }

    const calcDensity = calculateDensity(acidConcentration, coefficients);
    document.getElementById('acid_density').value = calcDensity.toFixed(4);

    // Массовая доля кислоты в растворе
    const massFraction = acidConcentration / 100;

    // Масса элемента в 1 г кислоты при данной концентрации
    const elementMassInGram = (elementMassPercent / 100) * massFraction * molarMass;

    // Масса элемента в 1 мл кислоты
    const elementMassInMl = elementMassInGram * calcDensity;

    // ppm в мл = (массовая доля вещества * 10^6) / молярная масса
    const ppmInMl = (elementMassInMl * 1000) / molarMass;

    // ppm в граммах = ppm в мл / плотность
    const ppmInG = ppmInMl / calcDensity;

    // Процентное содержание элемента в растворе
    const elementPercentage = elementMassPercent * acidConcentration / 100;
    document.getElementById('elementPPM_ml').textContent = ppmInMl.toFixed(2) + " ppm";
    document.getElementById('element_mass_ml').textContent = elementMassInMl.toFixed(6) + " мг/мл";
    document.getElementById('elementPPM_g').textContent = ppmInG.toFixed(2) + " ppm";
    document.getElementById('element_mass_g').textContent = elementMassInGram.toFixed(6) + " мг/г";
    document.getElementById('element_percentage').textContent = elementPercentage.toFixed(2) + "%";
    document.getElementById('element').textContent = element;
}

function calculateDensity(concentration, coefficients) {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
        result += coefficients[i] * Math.pow(concentration, i);
    }
    return result;
}

// Инициализируем расчет при загрузке страницы
window.onload = function() {
    calculateAcidContent();
};

// Вызываем расчет при изменении концентрации или типа кислоты
document.getElementById('acid_type').addEventListener('change', calculateAcidContent);
document.getElementById('acid_concentration').addEventListener('input', calculateAcidContent);

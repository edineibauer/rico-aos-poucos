@echo off
title Minerador Fundos.NET - Rico aos Poucos
echo.
echo ===================================================
echo   Iniciando minerador de documentos dos FIIs...
echo ===================================================
echo.
wsl.exe -d Ubuntu-24.04 bash -lc "cd /home/nenabauer/projetos/rico-aos-poucos/scripts/fundosnet && ./start_minerar.sh"
echo.
echo ===================================================
echo   Pressione qualquer tecla para fechar esta janela.
echo   O minerador continua rodando em segundo plano.
echo ===================================================
pause > nul

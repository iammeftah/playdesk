!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenue dans PlayDesk"
  !define MUI_WELCOMEPAGE_TEXT "PlayDesk est votre système complet de gestion de salle de jeux PS5.$\r$\n$\r$\nGérez vos stations, sessions, et revenus en toute simplicité — entièrement hors ligne et sécurisé.$\r$\n$\r$\nCliquez sur Suivant pour continuer l'installation."
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "PlayDesk est prêt !"
  !define MUI_FINISHPAGE_TEXT "L'installation est terminée.$\r$\n$\r$\nVotre clé de licence vous a été fournie séparément. Lancez l'application et entrez-la pour activer PlayDesk.$\r$\n$\r$\nMerci de nous faire confiance."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\PlayDesk.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Lancer PlayDesk maintenant"
!macroend

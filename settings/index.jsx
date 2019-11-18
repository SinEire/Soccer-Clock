function clockSettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Soccer Clock Settings</Text>}>
        <Select
          label="Game Clock"
          settingsKey="gameClock"
          options={[
            {name:"15:00", value:15},
            {name:"20:00", value:20},
            {name:"25:00", value:25},
            {name:"30:00", value:30},
            {name:"35:00", value:35},
            {name:"40:00", value:40},
            {name:"45:00", value:45}
          ]}
        />
        <Select
          label="Shift Clock"
          settingsKey="shiftClock"
          options={[
            {name:"3:00", value:3},
            {name:"4:00", value:4},
            {name:"5:00", value:5},
            {name:"6:00", value:6},
            {name:"7:00", value:7},
            {name:"8:00", value:8},
            {name:"9:00", value:9},
            {name:"10:00", value:10}
          ]}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(clockSettings);

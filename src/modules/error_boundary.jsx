import React from 'react';
import { loggingForModule } from '../utils/logging'

const logging = loggingForModule("react_error_boundary")

export default class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error) {  
        return { hasError: true };  
    }
    componentDidCatch(error, errorInfo) {   
        logging.error("react error", error, errorInfo);  
    }
    render() {
      if (this.state.hasError) { return (<p>react error</p>); } 
      else {
        return this.props.children; 

      }
    }
  }